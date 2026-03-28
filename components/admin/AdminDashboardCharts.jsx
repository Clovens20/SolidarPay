'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#0891B2', '#0E7490', '#06B6D4', '#14B8A6', '#10B981']

export default function AdminDashboardCharts({ charts, secondaryLoading, isMobile, chartHeight }) {
  const h = chartHeight ?? (isMobile ? 240 : 300)

  if (secondaryLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="min-w-0 overflow-hidden">
            <CardContent className="p-6">
              <div
                className="w-full animate-pulse rounded-lg bg-solidarpay-border/40"
                style={{ height: h }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Inscriptions par mois</CardTitle>
            <CardDescription>3 derniers mois</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full" style={{ height: h }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.registrations} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" name="Inscriptions" stroke="#0891B2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Tontines créées par mois</CardTitle>
            <CardDescription>3 derniers mois</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full" style={{ height: h }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.tontinesCreated} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" name="Tontines" fill="#0891B2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-1">
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Répartition géographique</CardTitle>
            <CardDescription>Utilisateurs inscrits par pays (profil)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {charts.geography.length === 0 ? (
              <p className="py-8 text-center text-sm text-solidarpay-text/70">
                Aucun pays renseigné sur les profils utilisateurs pour le moment.
              </p>
            ) : (
              <div className="w-full" style={{ height: h }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.geography}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={
                        isMobile
                          ? false
                          : ({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={isMobile ? Math.min(h * 0.32, 88) : Math.min(h * 0.36, 100)}
                      fill="#8884d8"
                      dataKey="users"
                      nameKey="country"
                    >
                      {charts.geography.map((entry, index) => (
                        <Cell key={`cell-${entry.country}-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    {isMobile ? <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 11 }} /> : null}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
