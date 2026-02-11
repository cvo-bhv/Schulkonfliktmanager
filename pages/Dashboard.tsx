import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Database } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import * as Storage from '../services/storage';
import { Incident, IncidentStatus } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadData = async () => {
    try {
        setLoading(true);
        // Only seeds if empty automatically
        await Storage.seedDataIfEmpty(); 
        const data = await Storage.getIncidents();
        setIncidents(data);
    } catch (error) {
        console.error("Failed to load incidents", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleForceSeed = async () => {
      if (!confirm("Dies wird ~100 Einträge in die Datenbank schreiben. Das dauert ca. 10-20 Sekunden. Fortfahren?")) return;
      
      setSeeding(true);
      try {
          await Storage.seedData(true); // true = force
          await loadData();
          alert("Demo-Daten erfolgreich erstellt!");
      } catch (e) {
          alert("Fehler beim Erstellen der Daten.");
      } finally {
          setSeeding(false);
      }
  };

  const openIncidents = incidents.filter(i => i.status === IncidentStatus.OPEN).length;
  const monitoringIncidents = incidents.filter(i => i.status === IncidentStatus.MONITORING).length;
  const recentIncidents = [...incidents].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const StatCard = ({ title, count, icon: Icon, colorClass, bgClass, targetStatus }: any) => (
    <div 
        onClick={() => targetStatus ? navigate(`/incidents?status=${targetStatus}`) : navigate('/incidents')}
        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${bgClass ? '' : ''}`}
    >
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{loading ? '...' : count}</p>
      </div>
      <div className={`p-4 rounded-full ${bgClass}`}>
        <Icon className={`w-8 h-8 ${colorClass}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Übersicht</h2>
        <p className="text-gray-500 mt-2">Willkommen im SchulKonflikt Manager. Hier ist der aktuelle Status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Offene Konflikte" 
          count={openIncidents} 
          icon={AlertTriangle} 
          colorClass="text-red-600" 
          bgClass="bg-red-50"
          targetStatus={IncidentStatus.OPEN}
        />
        <StatCard 
          title="Unter Beobachtung" 
          count={monitoringIncidents} 
          icon={Clock} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
          targetStatus={IncidentStatus.MONITORING}
        />
        <StatCard 
          title="Gesamteinträge" 
          count={incidents.length} 
          icon={ShieldAlert} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          title="Geklärte Fälle" 
          count={incidents.filter(i => i.status === IncidentStatus.RESOLVED).length} 
          icon={CheckCircle} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
          targetStatus={IncidentStatus.RESOLVED}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-800">Schnellzugriff</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4 flex-1">
             <NavLink to="/incidents/new" className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors group">
                <ShieldAlert className="w-10 h-10 text-blue-600 mb-3 group-hover:scale-110 transition-transform"/>
                <span className="font-semibold text-blue-800">Neuen Vorfall melden</span>
             </NavLink>
             <NavLink to="/incidents" className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors group">
                <Clock className="w-10 h-10 text-gray-600 mb-3 group-hover:scale-110 transition-transform"/>
                <span className="font-semibold text-gray-800">Protokolle einsehen</span>
             </NavLink>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-800">Letzte Einträge</h3>
          </div>
          <div className="divide-y divide-gray-100 flex-1">
            {loading ? (
                <div className="p-6 text-center text-gray-400">Lädt...</div>
            ) : recentIncidents.length === 0 ? (
                <div className="p-6 text-center text-gray-400">Keine Einträge vorhanden.</div>
            ) : (
                recentIncidents.map(inc => (
                    <div 
                        key={inc.id} 
                        onClick={() => navigate(`/incidents/edit/${inc.id}`)}
                        className="p-4 hover:bg-blue-50 flex justify-between items-center cursor-pointer transition-colors group"
                    >
                        <div>
                            <p className="font-medium text-gray-800 group-hover:text-blue-800 transition-colors">{inc.category}</p>
                            <p className="text-sm text-gray-500">{new Date(inc.date).toLocaleDateString()} • {inc.location}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${inc.status === IncidentStatus.OPEN ? 'bg-red-100 text-red-700' : 
                              inc.status === IncidentStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                              inc.status === IncidentStatus.MONITORING ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                            {inc.status}
                        </span>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Developer Tools Section */}
      <div className="mt-8 border-t border-gray-200 pt-8">
        <div className="flex justify-end">
            <button 
                onClick={handleForceSeed}
                disabled={seeding}
                className="flex items-center space-x-2 text-xs text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded border border-gray-200"
            >
                <Database className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
                <span>{seeding ? 'Erstelle Einträge... (bitte warten)' : 'Demo-Daten generieren (Skibidi Toilet & Co.)'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};