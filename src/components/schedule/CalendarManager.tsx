// src/components/schedule/CalendarManager.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';

import { scheduleService } from '../../services/schedule.service';
import ScheduleClassEditor from './ScheduleClassEditor';
import HolidayEditor from './HolidayEditor';
import VacationEditor from './VacationEditor';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, index, value }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`calendar-tabpanel-${index}`}
      aria-labelledby={`calendar-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

const CalendarManager: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [regularSchedule, setRegularSchedule] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [vacationPeriods, setVacationPeriods] = useState<any[]>([]);
  
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [showHolidayEditor, setShowHolidayEditor] = useState(false);
  const [showVacationEditor, setShowVacationEditor] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  useEffect(() => {
    loadCalendarData();
  }, []);
  
  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      // Charger l'emploi du temps
      const scheduleData = scheduleService.getRegularSchedule();
      setRegularSchedule(scheduleData);
      
      // Charger les jours fériés
      const holidaysData = scheduleService.getHolidays().filter(h => 'date' in h);
      setHolidays(holidaysData);
      
      // Charger les périodes de vacances
      const vacationsData = scheduleService.getHolidays().filter(h => 'startDate' in h && 'endDate' in h);
      setVacationPeriods(vacationsData);
      
      setError(null);
    } catch (err) {
      console.error("Erreur lors du chargement des données de calendrier:", err);
      setError("Impossible de charger les données. Veuillez rafraîchir la page.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Gestion des emplois du temps
  const handleAddScheduleItem = () => {
    setEditingItem(null);
    setShowScheduleEditor(true);
  };
  
  const handleEditScheduleItem = (item: any) => {
    setEditingItem(item);
    setShowScheduleEditor(true);
  };
  
  const handleScheduleSave = (scheduleItem: any) => {
    try {
      // Logique de sauvegarde
      if (editingItem) {
        // Modifier un horaire existant
        const updatedSchedule = regularSchedule.map(day => {
          if (day.day === scheduleItem.day) {
            return {
              ...day,
              classes: day.classes.map((cls: any) => 
                cls.id === scheduleItem.id ? scheduleItem : cls
              )
            };
          }
          return day;
        });
        
        setRegularSchedule(updatedSchedule);
        scheduleService.saveRegularSchedule(updatedSchedule);
      } else {
        // Ajouter un nouvel horaire
        const daySchedule = regularSchedule.find(d => d.day === scheduleItem.day);
        
        if (daySchedule) {
          // Jour déjà présent, ajouter la classe
          const updatedSchedule = regularSchedule.map(day => {
            if (day.day === scheduleItem.day) {
              return {
                ...day,
                classes: [...day.classes, scheduleItem]
              };
            }
            return day;
          });
          
          setRegularSchedule(updatedSchedule);
          scheduleService.saveRegularSchedule(updatedSchedule);
        } else {
          // Nouveau jour, créer l'entrée
          const newSchedule = [
            ...regularSchedule,
            { day: scheduleItem.day, classes: [scheduleItem] }
          ];
          
          setRegularSchedule(newSchedule);
          scheduleService.saveRegularSchedule(newSchedule);
        }
      }
      
      setShowScheduleEditor(false);
      setEditingItem(null);
      setSuccess("Emploi du temps sauvegardé avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'emploi du temps:", error);
      setError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    }
  };
  
  // Gestion des jours fériés
  const handleAddHoliday = () => {
    setEditingItem(null);
    setShowHolidayEditor(true);
  };
  
  const handleEditHoliday = (item: any) => {
    setEditingItem(item);
    setShowHolidayEditor(true);
  };
  
  const handleHolidaySave = (holiday: any) => {
    try {
      let updatedHolidays;
      
      if (editingItem) {
        // Modifier un jour férié existant
        updatedHolidays = holidays.map(h => 
          h.id === holiday.id ? holiday : h
        );
      } else {
        // Ajouter un nouveau jour férié
        updatedHolidays = [...holidays, holiday];
      }
      
      setHolidays(updatedHolidays);
      
      // Mettre à jour le service de calendrier
      const allHolidays = [...updatedHolidays, ...vacationPeriods];
      scheduleService.saveHolidays(allHolidays);
      
      setShowHolidayEditor(false);
      setEditingItem(null);
      setSuccess("Jour férié sauvegardé avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du jour férié:", error);
      setError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    }
  };
  
  // Gestion des vacances
  const handleAddVacation = () => {
    setEditingItem(null);
    setShowVacationEditor(true);
  };
  
  const handleEditVacation = (item: any) => {
    setEditingItem(item);
    setShowVacationEditor(true);
  };
  
  const handleVacationSave = (vacation: any) => {
    try {
      let updatedVacations;
      
      if (editingItem) {
        // Modifier une période de vacances existante
        updatedVacations = vacationPeriods.map(v => 
          v.id === vacation.id ? vacation : v
        );
      } else {
        // Ajouter une nouvelle période de vacances
        updatedVacations = [...vacationPeriods, vacation];
      }
      
      setVacationPeriods(updatedVacations);
      
      // Mettre à jour le service de calendrier
      const allHolidays = [...holidays, ...updatedVacations];
      scheduleService.saveHolidays(allHolidays);
      
      setShowVacationEditor(false);
      setEditingItem(null);
      setSuccess("Période de vacances sauvegardée avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la période de vacances:", error);
      setError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    }
  };
  
  // Suppression d'un élément
  const handleDeleteItem = (type: 'schedule' | 'holiday' | 'vacation', itemId: string) => {
    try {
      if (type === 'schedule') {
        // Supprimer un horaire de cours
        const updatedSchedule = regularSchedule.map(day => ({
          ...day,
          classes: day.classes.filter((cls: any) => cls.id !== itemId)
        }));
        
        setRegularSchedule(updatedSchedule);
        scheduleService.saveRegularSchedule(updatedSchedule);
      } else if (type === 'holiday') {
        // Supprimer un jour férié
        const updatedHolidays = holidays.filter(h => h.id !== itemId);
        setHolidays(updatedHolidays);
        
        // Mettre à jour le service de calendrier
        const allHolidays = [...updatedHolidays, ...vacationPeriods];
        scheduleService.saveHolidays(allHolidays);
      } else if (type === 'vacation') {
        // Supprimer une période de vacances
        const updatedVacations = vacationPeriods.filter(v => v.id !== itemId);
        setVacationPeriods(updatedVacations);
        
        // Mettre à jour le service de calendrier
        const allHolidays = [...holidays, ...updatedVacations];
        scheduleService.saveHolidays(allHolidays);
      }
      
      setSuccess("Élément supprimé avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression. Veuillez réessayer.");
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Gestion du calendrier scolaire
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue}
          onChange={handleTabChange}
          aria-label="calendar tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<CalendarMonthIcon />} 
            label="Emploi du temps" 
            id="calendar-tab-0"
            aria-controls="calendar-tabpanel-0"
          />
          <Tab 
            icon={<EventIcon />} 
            label="Jours fériés" 
            id="calendar-tab-1"
            aria-controls="calendar-tabpanel-1"
          />
          <Tab 
            icon={<BeachAccessIcon />} 
            label="Vacances scolaires" 
            id="calendar-tab-2"
            aria-controls="calendar-tabpanel-2"
          />
        </Tabs>
        
        <Divider />
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Emploi du temps hebdomadaire
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddScheduleItem}
            >
              Ajouter un cours
            </Button>
          </Box>
          
          {regularSchedule.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Aucun emploi du temps défini. Cliquez sur "Ajouter un cours" pour commencer.
            </Typography>
          ) : (
            <ScheduleClassList
              scheduleData={regularSchedule}
              onEdit={handleEditScheduleItem}
              onDelete={(itemId) => handleDeleteItem('schedule', itemId)}
            />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Jours fériés
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddHoliday}
            >
              Ajouter un jour férié
            </Button>
          </Box>
          
          {holidays.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Aucun jour férié défini. Cliquez sur "Ajouter un jour férié" pour commencer.
            </Typography>
          ) : (
            <HolidayList
              holidays={holidays}
              onEdit={handleEditHoliday}
              onDelete={(itemId) => handleDeleteItem('holiday', itemId)}
            />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Vacances scolaires
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddVacation}
            >
              Ajouter une période de vacances
            </Button>
          </Box>
          
          {vacationPeriods.length === 0 ? (
            <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Aucune période de vacances définie. Cliquez sur "Ajouter une période de vacances" pour commencer.
            </Typography>
          ) : (
            <VacationList
              vacations={vacationPeriods}
              onEdit={handleEditVacation}
              onDelete={(itemId) => handleDeleteItem('vacation', itemId)}
            />
          )}
        </TabPanel>
      </Paper>
      
      {/* Dialogue d'édition d'emploi du temps */}
      <ScheduleClassEditor
        open={showScheduleEditor}
        onClose={() => setShowScheduleEditor(false)}
        onSave={handleScheduleSave}
        scheduleItem={editingItem}
      />
      
      {/* Dialogue d'édition de jour férié */}
      <HolidayEditor
        open={showHolidayEditor}
        onClose={() => setShowHolidayEditor(false)}
        onSave={handleHolidaySave}
        holiday={editingItem}
      />
      
      {/* Dialogue d'édition de vacances */}
      <VacationEditor
        open={showVacationEditor}
        onClose={() => setShowVacationEditor(false)}
        onSave={handleVacationSave}
        vacation={editingItem}
      />
    </Box>
  );
};

// Composant pour afficher la liste des cours
interface ScheduleClassListProps {
  scheduleData: any[];
  onEdit: (item: any) => void;
  onDelete: (itemId: string) => void;
}

const ScheduleClassList: React.FC<ScheduleClassListProps> = ({ 
  scheduleData, 
  onEdit, 
  onDelete 
}) => {
  const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  
  // Trier les jours selon l'ordre standard
  const sortedSchedule = [...scheduleData].sort((a, b) => 
    daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day)
  );
  
  return (
    <Box>
      {sortedSchedule.map(day => (
        <Box key={day.day} sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ 
            mb: 1, 
            textTransform: 'capitalize',
            fontWeight: 'bold'
          }}>
            {day.day}
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2 }}>
            {day.classes.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
                Aucun cours programmé ce jour
              </Typography>
            ) : (
              day.classes.sort((a: any, b: any) => {
                const timeA = a.startTime.split(':').map(Number);
                const timeB = b.startTime.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
              }).map((cls: any, index: number) => (
                <Box 
                  key={cls.id || index} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    borderBottom: index < day.classes.length - 1 ? '1px solid #eee' : 'none',
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                >
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {cls.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {cls.group} • {cls.startTime}-{cls.endTime} • Salle: {cls.room || 'Non spécifiée'}
                      {cls.alternating && ` • Semaine ${cls.weekType === 'odd' ? 'impaire' : 'paire'}`}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Button 
                      size="small" 
                      onClick={() => onEdit(cls)}
                      sx={{ mr: 1 }}
                    >
                      Modifier
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => onDelete(cls.id)}
                    >
                      Supprimer
                    </Button>
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

// Composant pour afficher la liste des jours fériés
interface HolidayListProps {
  holidays: any[];
  onEdit: (item: any) => void;
  onDelete: (itemId: string) => void;
}

const HolidayList: React.FC<HolidayListProps> = ({ 
  holidays, 
  onEdit, 
  onDelete 
}) => {
  // Trier les jours fériés par date
  const sortedHolidays = [...holidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {sortedHolidays.map((holiday, index) => (
        <Box 
          key={holiday.id || index} 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            borderBottom: index < sortedHolidays.length - 1 ? '1px solid #eee' : 'none',
            '&:hover': { bgcolor: '#f5f5f5' }
          }}
        >
          <Box>
            <Typography variant="body1" fontWeight="medium">
              {holiday.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(holiday.date).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </Typography>
            {holiday.description && (
              <Typography variant="body2" color="text.secondary">
                {holiday.description}
              </Typography>
            )}
          </Box>
          
          <Box>
            <Button 
              size="small" 
              onClick={() => onEdit(holiday)}
              sx={{ mr: 1 }}
            >
              Modifier
            </Button>
            <Button 
              size="small" 
              color="error"
              onClick={() => onDelete(holiday.id)}
            >
              Supprimer
            </Button>
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

// Composant pour afficher la liste des périodes de vacances
interface VacationListProps {
  vacations: any[];
  onEdit: (item: any) => void;
  onDelete: (itemId: string) => void;
}

const VacationList: React.FC<VacationListProps> = ({ 
  vacations, 
  onEdit, 
  onDelete 
}) => {
  // Trier les périodes de vacances par date de début
  const sortedVacations = [...vacations].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {sortedVacations.map((vacation, index) => (
        <Box 
          key={vacation.id || index} 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            borderBottom: index < sortedVacations.length - 1 ? '1px solid #eee' : 'none',
            '&:hover': { bgcolor: '#f5f5f5' }
          }}
        >
          <Box>
            <Typography variant="body1" fontWeight="medium">
              {vacation.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Du {new Date(vacation.startDate).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })} au {new Date(vacation.endDate).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
            </Typography>
            {vacation.description && (
              <Typography variant="body2" color="text.secondary">
                {vacation.description}
              </Typography>
            )}
          </Box>
          
          <Box>
            <Button 
              size="small" 
              onClick={() => onEdit(vacation)}
              sx={{ mr: 1 }}
            >
              Modifier
            </Button>
            <Button 
              size="small" 
              color="error"
              onClick={() => onDelete(vacation.id)}
            >
              Supprimer
            </Button>
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

export default CalendarManager;