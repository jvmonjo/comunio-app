<script setup>
const { settings, updateSettings } = useInvoiceStore()
const toast = useToast()

const localPeople = ref([])
const localMode = ref('complex')

onMounted(() => {
    if (settings.value) {
        localPeople.value = JSON.parse(JSON.stringify(settings.value.people || []))
        localMode.value = settings.value.splitMode || 'complex'
    }
})

const addPerson = () => {
    localPeople.value.push({
        id: Math.random().toString(36).substring(7),
        name: `Persona ${localPeople.value.length + 1}`,
        fixedPercentage: 0,
        consumptionPercentage: 0
    })
}

const removePerson = (index) => {
    localPeople.value.splice(index, 1)
}

const save = () => {
    const sumFixed = localPeople.value.reduce((s, p) => s + (p.fixedPercentage || 0), 0)
    const sumVar = localPeople.value.reduce((s, p) => s + (p.consumptionPercentage || 0), 0)
    
    if (Math.abs(sumFixed - 100) > 0.1) {
        toast.add({ title: 'Advertencia', description: `La suma de porcentajes fijos es ${sumFixed}%, debería ser 100%`, color: 'amber', timeout: 5000 })
    }
    
    if (localMode.value === 'complex' && Math.abs(sumVar - 100) > 0.1) {
         toast.add({ title: 'Advertencia', description: `La suma de porcentajes de consumo es ${sumVar}%, debería ser 100%`, color: 'amber', timeout: 5000 })
    }
    
    updateSettings({
        people: localPeople.value,
        splitMode: localMode.value
    })
    toast.add({ title: 'Guardado', description: 'Configuración actualizada correctamente', color: 'green' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 pb-20">
      <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Configuración</h1>
            <p class="text-slate-500 mt-1">Define quién participa en los gastos y cómo se reparten.</p>
        </div>
        <UButton icon="i-lucide-save" color="green" variant="solid" size="lg" @click="save">Guardar Cambios</UButton>
      </div>

      <UCard>
          <template #header>
              <h3 class="font-semibold text-lg flex items-center gap-2">
                  <UIcon name="i-lucide-sliders-horizontal" />
                  Modo de Reparto
              </h3>
          </template>
          <div class="space-y-4">
              <URadioGroup v-model="localMode" :options="[
                  { value: 'simple', label: 'Reparto Simple', description: 'Todos los items se reparten según un único porcentaje fijo.' },
                  { value: 'complex', label: 'Reparto Detallado', description: 'Los items fijos y variables (consumo) tienen porcentajes de reparto distintos.' }
              ]" />
          </div>
      </UCard>
      
      <UCard>
          <template #header>
              <div class="flex justify-between items-center">
                   <h3 class="font-semibold text-lg flex items-center gap-2">
                       <UIcon name="i-lucide-users" />
                       Personas
                   </h3>
                   <UButton size="sm" icon="i-lucide-user-plus" color="primary" variant="soft" @click="addPerson">Añadir Persona</UButton>
              </div>
          </template>
          
          <div class="space-y-4">
              <div v-if="localPeople.length === 0" class="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <p>Añade personas para empezar a repartir gastos.</p>
              </div>

              <div v-for="(person, index) in localPeople" :key="person.id" class="flex flex-col lg:flex-row gap-6 items-start lg:items-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                  <div class="w-full lg:w-1/4">
                       <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Nombre</label>
                       <UInput v-model="person.name" placeholder="Ej. Juan" icon="i-lucide-user" />
                  </div>
                  
                  <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                      <div>
                          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                              % Fijo / Global
                              <UTooltip text="Se aplica a todos los items en modo simple, o solo a los fijos en modo detallado" class="ml-1 inline-block">
                                  <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-slate-400" />
                              </UTooltip>
                          </label>
                          <UInput v-model.number="person.fixedPercentage" type="number" step="10">
                              <template #trailing><span class="text-slate-500 text-xs">%</span></template>
                          </UInput>
                      </div>
                      
                      <div :class="{ 'opacity-40 grayscale': localMode === 'simple' }">
                          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                              % Consumo
                              <UTooltip text="Solo se aplica a items de consumo (variables) cuando el modo es detallado" class="ml-1 inline-block">
                                  <UIcon name="i-lucide-help-circle" class="w-4 h-4 text-slate-400" />
                              </UTooltip>
                          </label>
                          <UInput v-model.number="person.consumptionPercentage" type="number" step="10" :disabled="localMode === 'simple'">
                              <template #trailing><span class="text-slate-500 text-xs">%</span></template>
                          </UInput>
                      </div>
                  </div>
                  
                  <UButton icon="i-lucide-trash-2" color="red" variant="soft" size="sm" @click="removePerson(index)" class="self-end lg:self-center" />
              </div>
          </div>
          
          <template #footer>
               <div class="flex justify-between text-sm text-slate-500">
                   <span>
                       Total Fijo: <span :class="{'text-red-500 font-bold': Math.abs(localPeople.reduce((s,p)=>s+(p.fixedPercentage||0),0) - 100) > 0.1, 'text-green-600 font-bold': Math.abs(localPeople.reduce((s,p)=>s+(p.fixedPercentage||0),0) - 100) <= 0.1}">{{ localPeople.reduce((s,p)=>s+(p.fixedPercentage||0),0) }}%</span>
                   </span>
                   <span v-if="localMode === 'complex'">
                       Total Consumo: <span :class="{'text-red-500 font-bold': Math.abs(localPeople.reduce((s,p)=>s+(p.consumptionPercentage||0),0) - 100) > 0.1, 'text-green-600 font-bold': Math.abs(localPeople.reduce((s,p)=>s+(p.consumptionPercentage||0),0) - 100) <= 0.1}">{{ localPeople.reduce((s,p)=>s+(p.consumptionPercentage||0),0) }}%</span>
                   </span>
               </div>
          </template>
      </UCard>
  </div>
</template>
