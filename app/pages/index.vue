<script setup>
const { invoices, removeInvoice, init } = useInvoiceStore()

onMounted(() => {
  init()
})

const columns = [
  { accessorKey: 'name', header: 'Factura' },
  { accessorKey: 'date', header: 'Fecha' },
  { accessorKey: 'total', header: 'Total' },
  { id: 'actions', header: 'Acciones' }
]

const items = computed(() => invoices.value.map(i => ({
  id: i.id,
  name: i.name || 'Sin nombre',
  date: i.date ? new Date(i.date).toLocaleDateString() : '-',
  total: (i.total || 0).toFixed(2) + ' €',
  raw: i
})))
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
         <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Facturas Recientes</h1>
         <p class="text-slate-500 mt-1">Gestiona y divide tus gastos fácilmente</p>
      </div>
      <UButton to="/new" icon="i-lucide-plus" color="green" variant="solid" size="lg" class="shadow-lg shadow-green-500/20">
        Nueva Factura
      </UButton>
    </div>

    <UCard :ui="{ 
      background: 'bg-white/50 dark:bg-slate-900/50', 
      ring: 'ring-1 ring-slate-200 dark:ring-slate-800', 
      shadow: 'shadow-xl',
      divide: 'divide-y divide-slate-100 dark:divide-slate-800'
    }" class="backdrop-blur-sm">
      
      <UTable 
        :columns="columns" 
        :data="items"
        :ui="{
             th: { base: 'text-left rtl:text-right' },
             td: { base: 'whitespace-nowrap' }
        }"
      >
         <template #name-cell="{ row }">
            <div class="font-medium text-slate-900 dark:text-white">{{ row.original.name }}</div>
         </template>
         
         <template #total-cell="{ row }">
            <div class="font-bold font-mono text-slate-700 dark:text-slate-300">{{ row.original.total }}</div>
         </template>

         <template #actions-cell="{ row }">
            <div class="flex gap-2">
               <UTooltip text="Ver detalles">
                  <UButton icon="i-lucide-eye" color="gray" variant="ghost" size="xs" :to="`/invoice/${row.original.id}`" />
               </UTooltip>
               <UTooltip text="Eliminar">
                 <UButton icon="i-lucide-trash" color="red" variant="ghost" size="xs" @click="removeInvoice(row.original.id)" />
               </UTooltip>
            </div>
         </template>
      </UTable>
      
      <div v-if="items.length === 0" class="text-center py-16 text-slate-500">
         <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <UIcon name="i-lucide-receipt" class="w-8 h-8 text-slate-400" />
         </div>
         <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">No hay facturas</h3>
         <p class="mb-6 max-w-sm mx-auto">Sube una imagen de tu factura para comenzar a extraer los datos y repartir gastos.</p>
         <UButton to="/new" variant="outline" color="green">Sube tu primera factura</UButton>
      </div>
    </UCard>
  </div>
</template>
