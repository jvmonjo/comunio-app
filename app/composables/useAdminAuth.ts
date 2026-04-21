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
    // Demo credentials bypass
    if (email === 'admin@demo.com' && password === 'demo123') {
      const mockUser = {
        id: 'demo-user-id',
        email: 'admin@demo.com',
        user_metadata: { full_name: 'Administrador Demo' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
      user.value = mockUser
      return { data: { user: mockUser, session: {} }, error: null }
    }

    const supabase = getClient()
    if (!supabase) return { error: { message: 'Configuració de Supabase no trobada. Fes servir les credencials demo si vols provar el panell.' } }
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
