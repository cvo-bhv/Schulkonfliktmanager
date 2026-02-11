import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, Trash2, Plus } from 'lucide-react';
import * as Storage from '../services/storage';
import { YearLevel, SchoolClass, Student, IncidentCategory, IncidentStatus } from '../types';

export const IncidentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  // Selection State
  const [years, setYears] = useState<YearLevel[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<IncidentCategory>(IncidentCategory.DISRUPTION);
  const [description, setDescription] = useState('');
  const [involvedPersons, setInvolvedPersons] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [immediateActions, setImmediateActions] = useState('');
  const [agreements, setAgreements] = useState('');
  const [parentContacted, setParentContacted] = useState(false);
  const [administrationContacted, setAdministrationContacted] = useState(false);
  const [socialServiceContacted, setSocialServiceContacted] = useState(false);
  const [socialServiceAbbreviation, setSocialServiceAbbreviation] = useState('');
  const [status, setStatus] = useState<IncidentStatus>(IncidentStatus.OPEN);

  useEffect(() => {
    const initData = async () => {
        // 1. Load Years always
        const loadedYears = await Storage.getYears();
        setYears(loadedYears);

        // 2. If Edit Mode, load data and pre-populate
        if (id) {
            const incident = await Storage.getIncident(id);
            if (incident) {
                // Load Basic Data
                setDate(incident.date);
                setTime(incident.time);
                setLocation(incident.location);
                setCategory(incident.category);
                setDescription(incident.description);
                setInvolvedPersons(incident.involvedPersons);
                setWitnesses(incident.witnesses);
                setImmediateActions(incident.immediateActions);
                setAgreements(incident.agreements);
                setParentContacted(incident.parentContacted);
                setAdministrationContacted(incident.administrationContacted || false);
                setSocialServiceContacted(incident.socialServiceContacted || false);
                setSocialServiceAbbreviation(incident.socialServiceAbbreviation || '');
                setStatus(incident.status);

                // Load Student Hierarchy
                const student = await Storage.getStudent(incident.studentId);
                if (student) {
                    const cls = await Storage.getClass(student.classId);
                    if (cls) {
                        // We need the data for dropdowns
                        const classesInYear = await Storage.getClassesByYear(cls.yearLevelId);
                        const studentsInClass = await Storage.getStudentsByClass(cls.id);
                        
                        setClasses(classesInYear);
                        setStudents(studentsInClass);

                        // Set selections
                        setSelectedYearId(cls.yearLevelId);
                        setSelectedClassId(cls.id);
                        setSelectedStudentId(student.id);
                    }
                }
            }
        }
    };
    initData();
  }, [id]);

  // --- Handlers for Hierarchy ---
  
  const handleYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const yearId = e.target.value;
      setSelectedYearId(yearId);
      
      // Reset downstream
      setSelectedClassId('');
      setSelectedStudentId('');
      setStudents([]);

      if (yearId) {
          const loadedClasses = await Storage.getClassesByYear(yearId);
          setClasses(loadedClasses);
      } else {
          setClasses([]);
      }
  };

  const handleClassChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const classId = e.target.value;
      setSelectedClassId(classId);

      // Reset downstream
      setSelectedStudentId('');
      
      if (classId) {
          const loadedStudents = await Storage.getStudentsByClass(classId);
          setStudents(loadedStudents);
      } else {
          setStudents([]);
      }
  };

  // --- Inline Creation Handlers (Async Fixed) ---

  const createYear = async () => {
    const name = window.prompt("Name des neuen Jahrgangs (z.B. 'Jahrgang 11'):");
    if (name) {
        const newYear = await Storage.saveYear(name);
        // Refresh list
        const updatedYears = await Storage.getYears();
        setYears(updatedYears);
        setSelectedYearId(newYear.id);
        
        // Reset downstream
        setClasses([]);
        setStudents([]);
        setSelectedClassId('');
        setSelectedStudentId('');
    }
  };

  const createClass = async () => {
    if (!selectedYearId) {
        alert("Bitte wählen Sie zuerst einen Jahrgang aus.");
        return;
    }
    const name = window.prompt("Name der neuen Klasse (z.B. '11a'):");
    if (name) {
        const newClass = await Storage.saveClass(selectedYearId, name);
        // Refresh list
        const updatedClasses = await Storage.getClassesByYear(selectedYearId);
        setClasses(updatedClasses);
        setSelectedClassId(newClass.id);
        
        // Reset downstream
        setStudents([]);
        setSelectedStudentId('');
    }
  };

  const createStudent = async () => {
    if (!selectedClassId) {
        alert("Bitte wählen Sie zuerst eine Klasse aus.");
        return;
    }
    const firstName = window.prompt("Vorname des Schülers:");
    if (!firstName) return;
    
    const lastName = window.prompt("Nachname des Schülers:");
    if (!lastName) return;

    const newStudent = await Storage.saveStudent(selectedClassId, firstName, lastName);
    // Refresh list
    const updatedStudents = await Storage.getStudentsByClass(selectedClassId);
    setStudents(updatedStudents);
    setSelectedStudentId(newStudent.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
        alert("Bitte wählen Sie einen Schüler aus.");
        return;
    }

    const incidentData = {
      studentId: selectedStudentId,
      date,
      time,
      location,
      category,
      description,
      involvedPersons,
      witnesses,
      immediateActions,
      agreements,
      parentContacted,
      administrationContacted,
      socialServiceContacted,
      socialServiceAbbreviation: socialServiceContacted ? socialServiceAbbreviation : '',
      status,
    };

    if (isEditMode && id) {
        await Storage.updateIncident({
            ...incidentData,
            id: id,
            createdAt: Date.now(), // optionally keep original createdAt
        });
    } else {
        await Storage.saveIncident(incidentData);
    }
    
    navigate('/incidents');
  };

  const handleDelete = async () => {
      if (isEditMode && id && confirm("Diesen Eintrag wirklich löschen?")) {
          await Storage.deleteIncident(id);
          navigate('/incidents');
      }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Vorfall bearbeiten' : 'Neuen Vorfall melden'}
        </h2>
        <div className="flex space-x-2">
            {isEditMode && (
                <button onClick={handleDelete} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition">
                    <Trash2 className="w-5 h-5" />
                </button>
            )}
            <button onClick={() => navigate('/incidents')} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition">
                <X className="w-6 h-6" />
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Section 1: Student Selection */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">1</span>
            Schüler:in auswählen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jahrgang</label>
              <div className="flex gap-2">
                <select
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedYearId}
                    onChange={handleYearChange}
                    required
                >
                    <option value="">Bitte wählen...</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
                <button type="button" onClick={createYear} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Neuen Jahrgang anlegen">
                    <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klasse</label>
              <div className="flex gap-2">
                <select
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedClassId}
                    onChange={handleClassChange}
                    disabled={!selectedYearId}
                    required
                >
                    <option value="">Bitte wählen...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button 
                    type="button" 
                    onClick={createClass} 
                    className={`p-2 rounded ${!selectedYearId ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`} 
                    disabled={!selectedYearId}
                    title="Neue Klasse anlegen"
                >
                    <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schüler:in</label>
              <div className="flex gap-2">
                <select
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={!selectedClassId}
                    required
                >
                    <option value="">Bitte wählen...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
                </select>
                <button 
                    type="button" 
                    onClick={createStudent} 
                    className={`p-2 rounded ${!selectedClassId ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`} 
                    disabled={!selectedClassId}
                    title="Neuen Schüler anlegen"
                >
                    <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Basic Info */}
        <div className="p-6 border-b border-gray-100">
             <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
                Rahmendaten
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
                        <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Ort des Vorfalls</label>
                     <input type="text" required value={location} onChange={e => setLocation(e.target.value)} placeholder="z.B. Klassenzimmer, Pausenhof..." className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                    <select value={category} onChange={e => setCategory(e.target.value as IncidentCategory)} className="w-full border border-gray-300 rounded-md p-2">
                        {Object.values(IncidentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* Section 3: Details */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
             <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">3</span>
                Detaillierte Beschreibung
            </h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Was ist passiert? (Beschreibung)</label>
                    <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sachliche Schilderung des Hergangs..."></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Weitere Beteiligte</label>
                         <input type="text" value={involvedPersons} onChange={e => setInvolvedPersons(e.target.value)} placeholder="Namen..." className="w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Zeugen</label>
                         <input type="text" value={witnesses} onChange={e => setWitnesses(e.target.value)} placeholder="Namen..." className="w-full border border-gray-300 rounded-md p-2" />
                    </div>
                </div>
            </div>
        </div>

        {/* Section 4: Measures */}
        <div className="p-6">
             <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">4</span>
                Maßnahmen & Verbleib
            </h3>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ergriffene Sofortmaßnahmen</label>
                    <textarea rows={2} value={immediateActions} onChange={e => setImmediateActions(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="z.B. Elterngespräch, Reflexionsbogen..."></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vereinbarungen / Konsequenzen</label>
                    <textarea rows={2} value={agreements} onChange={e => setAgreements(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="z.B. Entschuldigung, Dienst für die Gemeinschaft..."></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <input type="checkbox" id="parentContact" checked={parentContacted} onChange={e => setParentContacted(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="parentContact" className="text-gray-700 font-medium cursor-pointer select-none text-sm">Eltern informiert</label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <input type="checkbox" id="adminContact" checked={administrationContacted} onChange={e => setAdministrationContacted(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="adminContact" className="text-gray-700 font-medium cursor-pointer select-none text-sm">Schulleitung inf.</label>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center space-x-2">
                        <div className="flex items-center flex-1 space-x-2">
                            <input type="checkbox" id="socialContact" checked={socialServiceContacted} onChange={e => setSocialServiceContacted(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <label htmlFor="socialContact" className="text-gray-700 font-medium cursor-pointer select-none text-sm whitespace-nowrap">Schulsozialarbeit</label>
                        </div>
                        {socialServiceContacted && (
                            <input 
                                type="text" 
                                placeholder="Kürzel" 
                                value={socialServiceAbbreviation} 
                                onChange={e => setSocialServiceAbbreviation(e.target.value)}
                                className="w-16 p-1 border border-gray-300 rounded text-sm"
                            />
                        )}
                    </div>
                </div>

                <div className="pt-4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                     <div className="flex space-x-2">
                        {Object.values(IncidentStatus).map((stat) => (
                             <button
                                key={stat}
                                type="button"
                                onClick={() => setStatus(stat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
                                    ${status === stat 
                                        ? 'bg-slate-800 text-white border-slate-800' 
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                    }`}
                             >
                                {stat}
                             </button>
                        ))}
                     </div>
                </div>
            </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button type="button" onClick={() => navigate('/incidents')} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Abbrechen</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center">
                <Save className="w-4 h-4 mr-2" /> {isEditMode ? 'Aktualisieren' : 'Speichern'}
            </button>
        </div>

      </form>
    </div>
  );
};