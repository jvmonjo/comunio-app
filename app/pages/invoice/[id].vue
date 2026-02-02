<script setup>
const route = useRoute()
const router = useRouter()
const { invoices, updateInvoice, settings, init } = useInvoiceStore()
const toast = useToast()

const invoiceId = route.params.id
const invoice = ref(null)

onMounted(() => {
    init()
    const found = invoices.value.find(i => i.id === invoiceId)
    if (!found) {
        toast.add({ title: 'Error', description: 'Factura no encontrada', color: 'red' })
        router.push('/')
        return
    }
    // Deep copy to avoid mutating store directly until save
    invoice.value = JSON.parse(JSON.stringify(found))
})

const save = () => {
    if (!invoice.value) return
    // Recalculate total
    invoice.value.total = invoice.value.items.reduce((sum, item) => sum + item.amount, 0)

    updateInvoice(invoice.value)
    toast.add({ title: 'Guardado', description: 'Cambios guardados correctamente', color: 'green' })
}

const addItem = () => {
    invoice.value.items.push({
        id: Math.random().toString(36).substring(7),
        description: 'Nuevo Concepto',
        amount: 0,
        isFixed: false
    })
}

const removeItem = (index) => {
    invoice.value.items.splice(index, 1)
}

// Split Logic
const splitResults = computed(() => {
    if (!invoice.value || !settings.value.people.length) return []

    const items = invoice.value.items
    const fixedTotal = items.filter(i => i.isFixed).reduce((s, i) => s + i.amount, 0)
    const varTotal = items.filter(i => !i.isFixed).reduce((s, i) => s + i.amount, 0)
    const total = fixedTotal + varTotal

    return settings.value.people.map(p => {
        let amount = 0
        let detailFixed = 0
        let detailVar = 0

        if (settings.value.splitMode === 'simple') {
            const ratio = p.fixedPercentage / 100
            amount = total * ratio
            detailFixed = fixedTotal * ratio // Just for display consistency
            detailVar = varTotal * ratio
        } else {
            const ratioFixed = p.fixedPercentage / 100
            const ratioVar = p.consumptionPercentage / 100

            detailFixed = fixedTotal * ratioFixed
            detailVar = varTotal * ratioVar
            amount = detailFixed + detailVar
        }

        return {
            id: p.id,
            name: p.name,
            amount,
            detailFixed,
            detailVar
        }
    })
})

const exportJSON = () => {
    if (!invoice.value) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ invoice: invoice.value, split: splitResults.value }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `invoice-${invoice.value.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
</script>

<template>
    <div v-if="invoice" class="space-y-8 pb-20">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between gap-4">
            <div class="space-y-2 flex-1">
                <UInput v-model="invoice.name" size="xl" placeholder="Nombre de la factura"
                    :ui="{ size: { xl: 'text-2xl font-bold' }, color: { white: { outline: 'shadow-none ring-0 focus:ring-0 px-0' } } }"
                    class="max-w-md" />
                <div class="flex items-center gap-2 text-slate-500">
                    <UIcon name="i-lucide-calendar" />
                    <span>{{ new Date(invoice.date).toLocaleDateString() }}</span>
                </div>
            </div>
            <div class="flex gap-2 self-start">
                <UButton icon="i-lucide-download" color="gray" variant="ghost" @click="exportJSON">Exportar JSON
                </UButton>
                <UButton icon="i-lucide-save" color="green" variant="solid" @click="save">Guardar Cambios</UButton>
            </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
            <!-- Main Content: Invoice Items -->
            <div class="lg:col-span-2 space-y-6">
                <UCard :ui="{ body: { padding: 'p-0' } }">
                    <template #header>
                        <div class="flex justify-between items-center">
                            <h3 class="font-semibold text-lg">Conceptos</h3>
                            <UButton size="xs" color="gray" variant="ghost" icon="i-lucide-plus" @click="addItem">Añadir
                                Item</UButton>
                        </div>
                    </template>

                    <div class="max-h-[600px] overflow-y-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 sticky top-0">
                                <tr>
                                    <th class="px-4 py-3">Descripción</th>
                                    <th class="px-4 py-3 text-right">Cuantía</th>
                                    <th class="px-4 py-3 text-center">Tipo</th>
                                    <th class="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr v-for="(item, index) in invoice.items" :key="item.id"
                                    class="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td class="px-4 py-2">
                                        <UInput v-model="item.description" variant="none" placeholder="Descripción" />
                                    </td>
                                    <td class="px-4 py-2 text-right w-32">
                                        <UInput v-model.number="item.amount" type="number" variant="none"
                                            class="text-right font-mono" />
                                    </td>
                                    <td class="px-4 py-2 text-center w-32">
                                        <UBadge :color="item.isFixed ? 'blue' : 'orange'" variant="subtle"
                                            class="cursor-pointer select-none" @click="item.isFixed = !item.isFixed">
                                            {{ item.isFixed ? 'Fijo' : 'Variable' }}
                                        </UBadge>
                                    </td>
                                    <td class="px-4 py-2 text-center">
                                        <UButton icon="i-lucide-x" color="red" variant="ghost" size="xs"
                                            class="opacity-0 group-hover:opacity-100" @click="removeItem(index)" />
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot class="bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
                                <tr>
                                    <td class="px-4 py-3">TOTAL</td>
                                    <td class="px-4 py-3 text-right font-mono text-lg">
                                        {{invoice.items.reduce((s, i) => s + i.amount, 0).toFixed(2)}} €
                                    </td>
                                    <td colspan="2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </UCard>
            </div>

            <!-- Sidebar: Split Result -->
            <div class="space-y-6">
                <UCard class="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <template #header>
                        <div class="flex justify-between items-center">
                            <h3 class="font-semibold text-lg">Reparto</h3>
                            <UButton to="/settings" size="xs" color="gray" variant="link">Configurar</UButton>
                        </div>
                    </template>

                    <div v-if="!settings.people || settings.people.length === 0"
                        class="text-center py-4 text-slate-500 text-sm">
                        <p>No hay personas configuradas.</p>
                        <UButton to="/settings" class="mt-2" size="sm">Añadir Personas</UButton>
                    </div>

                    <div v-else class="space-y-4">
                        <div v-for="res in splitResults" :key="res.id"
                            class="flex justify-between items-center p-3 bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                            <div>
                                <div class="font-medium">{{ res.name }}</div>
                                <div class="text-xs text-slate-500">
                                    <span v-if="res.detailFixed > 0">Fijo: {{ res.detailFixed.toFixed(2) }}€</span>
                                    <span v-if="res.detailFixed > 0 && res.detailVar > 0"> • </span>
                                    <span v-if="res.detailVar > 0">Var: {{ res.detailVar.toFixed(2) }}€</span>
                                </div>
                            </div>
                            <div class="text-xl font-bold font-mono text-green-600 dark:text-green-400">
                                {{ res.amount.toFixed(2) }} €
                            </div>
                        </div>

                        <div
                            class="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <span class="text-sm font-medium text-slate-500">Sumatoria Reparto</span>
                            <span class="font-mono font-bold">{{splitResults.reduce((s, r) => s + r.amount,
                                0).toFixed(2)}}
                                €</span>
                        </div>
                    </div>
                </UCard>

                <UAlert v-if="settings && settings.splitMode === 'complex'" icon="i-lucide-info" color="blue"
                    variant="subtle" title="Modo Complejo"
                    description="Se aplican porcentajes diferentes para costes fijos y variables." />
            </div>
        </div>
    </div>
</template>
