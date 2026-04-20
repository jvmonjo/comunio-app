import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function useAdminAuth() {
  const config = useRuntimeConfig()
  const client = useState<SupabaseClient | null>('admin-supabase-client', () => null)
  const user = useState<any>('admin-user', () => null)
  
  function getClient() {
    if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) return null
    if (!client.value) {
      if (import.meta.client) {
        client.value = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
      } else {
        return createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
      }
    }
    return client.value
  }

  async function checkSession() {
    const supabase = getClient()
    if (!supabase) return false
    const { data } = await supabase.auth.getSession()
    user.value = data?.session?.user ?? null
    return !!data?.session
  }

  async function login(email: string, password: string) {
    const supabase = getClient()
    if (!supabase) return { error: { message: 'Configuració de Supabase no trobada' } }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      user.value = data.session?.user
    }
    return { data, error }
  }

  async function logout() {
    const supabase = getClient()
    if (!supabase) return
    await supabase.auth.signOut()
    user.value = null
  }

  return {
    user,
    getClient,
    checkSession,
    login,
    logout
  }
}
