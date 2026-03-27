'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Send } from 'lucide-react'

export default function TontineMessages({ tontineId }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState([])
  const [repliesByMessageId, setRepliesByMessageId] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [sendingForMessageId, setSendingForMessageId] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tontineId) {
      loadMessages()
    }
  }, [tontineId])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const { data: authData } = await supabase.auth.getSession()
      setCurrentUserId(authData?.session?.user?.id || null)

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
      const list = data || []
      setMessages(list)

      const messageIds = list.map((m) => m.id)
      if (messageIds.length === 0) {
        setRepliesByMessageId({})
        return
      }

      const { data: replies, error: repliesError } = await supabase
        .from('tontine_message_replies')
        .select(`
          *,
          user:users!tontine_message_replies_userId_fkey (
            id,
            fullName,
            email
          )
        `)
        .in('messageId', messageIds)
        .order('createdAt', { ascending: true })

      if (repliesError) throw repliesError

      const grouped = {}
      for (const r of replies || []) {
        if (!grouped[r.messageId]) grouped[r.messageId] = []
        grouped[r.messageId].push(r)
      }
      setRepliesByMessageId(grouped)
    } catch (error) {
      console.error('Error loading messages:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages de la tontine',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const sendReply = async (messageId) => {
    const text = (replyDrafts[messageId] || '').trim()
    if (!text) return
    if (!currentUserId) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous reconnecter pour répondre au message.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSendingForMessageId(messageId)
      const { error } = await supabase.from('tontine_message_replies').insert({
        messageId,
        userId: currentUserId,
        reply: text,
      })
      if (error) throw error

      setReplyDrafts((prev) => ({ ...prev, [messageId]: '' }))
      await loadMessages()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d’envoyer la réponse',
        variant: 'destructive',
      })
    } finally {
      setSendingForMessageId(null)
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
              <div className="mt-3 border-t pt-3 space-y-3">
                {(repliesByMessageId[message.id] || []).map((reply) => (
                  <div key={reply.id} className="bg-slate-50 rounded-md p-3 border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-solidarpay-text">
                        {reply.user?.fullName || 'Membre'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(reply.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.reply}</p>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="Écrire une réponse..."
                    value={replyDrafts[message.id] || ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [message.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void sendReply(message.id)
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => void sendReply(message.id)}
                    disabled={sendingForMessageId === message.id || !(replyDrafts[message.id] || '').trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Répondre
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

