<script setup>
const { processImage, isProcessing } = useOCR()
const { addInvoice } = useInvoiceStore()
const router = useRouter()
const toast = useToast()

const fileInput = ref(null) // Template ref (if using custom trigger)
const previewUrl = ref(null)
const selectedFile = ref(null)

const onFileChange = (e) => {
    const file = e.target?.files?.[0] || e[0] // Support drag/drop or input
    if (!file) return
    selectedFile.value = file

    if (file.type === 'application/pdf') {
        previewUrl.value = 'PDF_PREVIEW_MARKER' // dummy value to trigger preview
    } else {
        previewUrl.value = URL.createObjectURL(file)
    }
}

const handleProcess = async () => {
    if (!selectedFile.value) return

    try {
        const items = await processImage(selectedFile.value)

        if (items.length === 0) {
            toast.add({ title: 'Aviso', description: 'No se encontraron conceptos claros. Puedes añadirlos manualmente.', color: 'amber' })
        }

        const total = items.reduce((sum, item) => sum + item.amount, 0)

        const newInvoice = {
            id: Math.random().toString(36).substring(7),
            name: `Factura ${new Date().toISOString().split('T')[0]}`,
            date: new Date().toISOString(),
            items,
            total
        }

        addInvoice(newInvoice)

        toast.add({ title: 'Éxito', description: 'Factura procesada correctamente', color: 'green' })
        router.push(`/invoice/${newInvoice.id}`)

    } catch (e) {
        console.error(e)
        toast.add({ title: 'Error', description: 'No se pudo procesar la imagen', color: 'red' })
    }
}

// Drag and drop setup?
// Nuxt UI doesn't have a Dropzone component by default, we'll build a simple one.
const dropZoneRef = ref(null)
const isDragging = ref(false)

const onDrop = (e) => {
    isDragging.value = false
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        onFileChange([file])
    }
}
</script>

<template>
    <div class="max-w-2xl mx-auto space-y-8">
        <div class="text-center">
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Nueva Factura</h1>
            <p class="text-slate-500 mt-2">Sube una foto o PDF de tu factura para procesarla</p>
        </div>

        <UCard :ui="{ background: 'bg-white dark:bg-slate-900', ring: 'ring-1 ring-slate-200 dark:ring-slate-800' }">

            <div class="border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 relative overflow-hidden"
                :class="[
                    isDragging ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-400',
                    previewUrl ? 'border-none p-0' : ''
                ]" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="onDrop">
                <input type="file" ref="fileInput" accept="image/*,.pdf"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" @change="onFileChange" />

                <div v-if="previewUrl" class="relative group">
                    <div v-if="selectedFile?.type === 'application/pdf'"
                        class="w-full h-64 bg-slate-100 dark:bg-slate-950 rounded-lg flex flex-col items-center justify-center text-slate-500">
                        <UIcon name="i-lucide-file-text" class="w-16 h-16 mb-2 text-red-500" />
                        <span class="font-medium">{{ selectedFile.name }}</span>
                        <span class="text-sm">Documento PDF</span>
                    </div>
                    <img v-else :src="previewUrl"
                        class="w-full h-auto rounded-lg max-h-96 object-contain bg-slate-100 dark:bg-slate-950" />

                    <div
                        class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                        <p class="text-white font-medium">Click o arrastra para cambiar</p>
                    </div>
                    <!-- Reset button -->
                    <UButton icon="i-lucide-x" color="red" variant="solid"
                        class="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100" size="xs"
                        @click.stop.prevent="previewUrl = null; selectedFile = null" />
                </div>

                <div v-else class="pointer-events-none">
                    <div
                        class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <UIcon name="i-lucide-upload-cloud" class="w-8 h-8" />
                    </div>
                    <h3 class="text-lg font-medium text-slate-900 dark:text-white">Arrastra o selecciona una factura
                    </h3>
                    <p class="text-sm text-slate-500 mt-1">Soporta JPG, PNG, PDF</p>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton to="/" variant="ghost" color="gray">Cancelar</UButton>
                    <UButton @click="handleProcess" :loading="isProcessing" :disabled="!selectedFile" color="green"
                        variant="solid" icon="i-lucide-wand-2">
                        Procesar Factura
                    </UButton>
                </div>
            </template>
        </UCard>
    </div>
</template>
