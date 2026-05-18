import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(undefined)  // undefined = loading

  useEffect(() => {
    // get initial session (handles magic-link redirect hash automatically)
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    })
    return error
  }

  const signOut = () => supabase.auth.signOut()

  return { session, signInWithEmail, signOut }
}
