'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function CommunicationTab({ tontineId, tontineName }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deleteMessageId, setDeleteMessageId] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadMessages()
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

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast({
        title: 'Message vide',
        description: 'Veuillez écrire un message avant d\'envoyer',
        variant: 'destructive',
      })
      return
    }

    try {
      setSending(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive',
        })
        return
      }

      const { data, error } = await supabase
        .from('tontine_messages')
        .insert({
          tontineId,
          adminId: session.user.id,
          message: newMessage.trim(),
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé à tous les membres de la tontine',
      })

      setNewMessage('')
      loadMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer le message',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return

    try {
      const { error } = await supabase
        .from('tontine_messages')
        .delete()
        .eq('id', deleteMessageId)

      if (error) throw error

      toast({
        title: 'Message supprimé',
        description: 'Le message a été supprimé avec succès',
      })

      setDeleteMessageId(null)
      setShowDeleteDialog(false)
      loadMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le message',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solidarpay-primary mx-auto"></div>
          <p className="mt-4 text-solidarpay-text">Chargement des messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Formulaire pour envoyer un message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-solidarpay-primary" />
            Envoyer un message aux membres
          </CardTitle>
          <CardDescription>
            Écrivez un message qui sera visible par tous les membres de la tontine "{tontineName}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Écrivez votre message ici... (ex: Rappel de cotisation, informations importantes, etc.)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={5}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="bg-solidarpay-primary hover:bg-solidarpay-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Envoi...' : 'Envoyer le message'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des messages envoyés */}
      <Card>
        <CardHeader>
          <CardTitle>Messages envoyés</CardTitle>
          <CardDescription>
            Historique de tous les messages envoyés aux membres
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-solidarpay-text/70">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-solidarpay-text/30" />
              <p>Aucun message envoyé pour le moment</p>
              <p className="text-sm mt-2">Utilisez le formulaire ci-dessus pour envoyer votre premier message</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-solidarpay-text">
                          {message.admin?.fullName || 'Administrateur'}
                        </p>
                        <span className="text-xs text-solidarpay-text/50">
                          {new Date(message.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-solidarpay-text whitespace-pre-wrap">{message.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteMessageId(message.id)
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le message</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteMessageId(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMessage}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

