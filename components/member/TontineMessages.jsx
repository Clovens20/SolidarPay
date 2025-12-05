'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function TontineMessages({ tontineId }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tontineId) {
      loadMessages()
    }
  }, [tontineId])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tontine_messages')
        .select(`
          *,
          admin:users!tontine_messages_adminId_fkey (
            id,
            "fullName",
            email
          )
        `)
        .eq('tontineId', tontineId)
        .order('createdAt', { ascending: false })
        .limit(5) // Afficher les 5 messages les plus récents

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (messages.length === 0) {
    return null
  }

  return (
    <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-600" />
          Messages de l'administrateur
        </CardTitle>
        <CardDescription>
          Derniers messages de l'administrateur de la tontine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className="bg-white p-4 rounded-lg border border-cyan-100 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-cyan-700">
                      {message.admin?.fullName || 'Administrateur'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

