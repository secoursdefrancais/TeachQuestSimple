// src/components/schedule/TimeTableView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  IconButton,
  Divider,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isToday, 
  addWeeks,
  subWeeks,
  isBefore,
  isAfter,
  parseISO,
  addDays,
  getWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';

import { scheduleService, ScheduleClass } from '../../services/schedule.service';
import ScheduleItem from './ScheduleItem';

// Dates limites de l'application
const MIN_DATE = new Date(2025, 2, 9); // 9 mars 2025
const MAX_DATE = new Date(2025, 5, 30); // 30 juin 2025

// Configuration de l'affichage de l'emploi du temps
const TIME_CONFIG = {
  startHour: 8, // 8h du matin
  startMinute: 30, // commencer à 8h30
  endHour: 17, // 17h du soir
  endMinute: 30, // finir à 17h30
  hourHeight: 80, // Hauteur en pixels pour une heure
  timeSlotInterval: 30 // Intervalle des labels de temps en minutes
};

export const TimeTableView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [schedule, setSchedule] = useState<Record<string, ScheduleClass[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Générer la liste des semaines disponibles
  const availableWeeks = useMemo(() => {
    const weeks = [];
    let weekStart = startOfWeek(MIN_DATE, { weekStartsOn: 1 });
    
    while (!isAfter(weekStart, MAX_DATE)) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekNumber = getWeek(weekStart, { locale: fr });
      
      weeks.push({
        dateString: format(weekStart, 'yyyy-MM-dd'),
        label: `Semaine ${weekNumber} (${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')})`,
        weekStart
      });
      
      weekStart = addDays(weekStart, 7);
    }
    
    return weeks;
  }, []);
  
  // Générer les créneaux horaires
  const timeSlots = useMemo(() => {
    const slots = [];
    const startMinutes = TIME_CONFIG.startHour * 60 + TIME_CONFIG.startMinute;
    const endMinutes = TIME_CONFIG.endHour * 60 + TIME_CONFIG.endMinute;
    const totalMinutes = endMinutes - startMinutes;
    const totalSlots = Math.ceil(totalMinutes / TIME_CONFIG.timeSlotInterval);
    
    for (let i = 0; i <= totalSlots; i++) {
      const minutes = startMinutes + (i * TIME_CONFIG.timeSlotInterval);
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      slots.push({
        label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        minutes: minutes - startMinutes // Minutes depuis le début de la plage
      });
    }
    
    return slots;
  }, []);
  
  // Vérifier que la date courante est dans les limites au chargement initial
  useEffect(() => {
    const now = new Date();
    if (isBefore(now, MIN_DATE)) {
      setCurrentDate(MIN_DATE);
    } else if (isAfter(now, MAX_DATE)) {
      setCurrentDate(startOfWeek(MAX_DATE, { weekStartsOn: 1 }));
    } else {
      setCurrentDate(now);
    }
  }, []);
  
  // Initialiser la semaine actuelle
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    try {
      const firstDay = startOfWeek(currentDate, { weekStartsOn: 1 }); // Commencer par lundi
      const lastDay = endOfWeek(currentDate, { weekStartsOn: 1 }); // Finir par dimanche
      
      const days = eachDayOfInterval({ start: firstDay, end: lastDay });
      if (mounted) setWeekDays(days.slice(0, 5)); // Garder seulement lundi à vendredi
      
      // Récupérer l'emploi du temps pour la semaine avec gestion d'erreur et retry
      const loadSchedule = async () => {
        try {
          const weekSchedule = scheduleService.getScheduleForWeek(firstDay);
          if (mounted) {
            setSchedule(weekSchedule);
            setError(null);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du planning:", error);
          if (mounted) setError("Tentative de rechargement des données...");
          
          // Tenter de recharger les données
          scheduleService.reloadData();
          
          // Attendre un moment puis réessayer
          setTimeout(() => {
            try {
              if (!mounted) return;
              
              const retrySchedule = scheduleService.getScheduleForWeek(firstDay);
              setSchedule(retrySchedule);
              setError(null);
            } catch (retryError) {
              if (mounted) {
                setError("Impossible de charger le planning. Veuillez rafraîchir la page.");
              }
            }
          }, 300);
        }
      };
      
      loadSchedule();
    } catch (error) {
      console.error("Erreur lors de l'initialisation du planning:", error);
      if (mounted) {
        setError("Une erreur est survenue lors du chargement du planning. Veuillez rafraîchir la page.");
      }
    } finally {
      if (mounted) setIsLoading(false);
    }
    
    // Nettoyage
    return () => {
      mounted = false;
    };
  }, [currentDate]);
  
  // Navigation entre les semaines
  const goToPreviousWeek = () => {
    const previousWeek = subWeeks(currentDate, 1);
    const minWeekStart = startOfWeek(MIN_DATE, { weekStartsOn: 1 });
    
    if (!isBefore(previousWeek, minWeekStart)) {
      setCurrentDate(previousWeek);
    }
  };
  
  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentDate, 1);
    const maxWeekStart = startOfWeek(MAX_DATE, { weekStartsOn: 1 });
    
    if (!isAfter(nextWeek, maxWeekStart)) {
      setCurrentDate(nextWeek);
    }
  };
  
  const goToToday = () => {
    const now = new Date();
    if (isBefore(now, MIN_DATE)) {
      setCurrentDate(MIN_DATE);
    } else if (isAfter(now, MAX_DATE)) {
      setCurrentDate(startOfWeek(MAX_DATE, { weekStartsOn: 1 }));
    } else {
      setCurrentDate(now);
    }
  };
  
  // Handler pour le sélecteur de semaine
  const handleWeekChange = (event: SelectChangeEvent) => {
    const selectedWeekDate = event.target.value;
    const week = availableWeeks.find(w => w.dateString === selectedWeekDate);
    
    if (week) {
      setCurrentDate(week.weekStart);
    }
  };
  
  // Vérifier si nous sommes aux limites du calendrier
  const isAtMinDate = useMemo(() => {
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const minWeekStart = startOfWeek(MIN_DATE, { weekStartsOn: 1 });
    return isBefore(currentWeekStart, minWeekStart) || currentWeekStart.getTime() === minWeekStart.getTime();
  }, [currentDate]);
  
  const isAtMaxDate = useMemo(() => {
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const maxWeekStart = startOfWeek(MAX_DATE, { weekStartsOn: 1 });
    return isAfter(currentWeekStart, maxWeekStart) || currentWeekStart.getTime() === maxWeekStart.getTime();
  }, [currentDate]);
  
  // Trouver l'index de la semaine actuelle pour le sélecteur
  const currentWeekValue = useMemo(() => {
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const foundWeek = availableWeeks.find(
      w => w.weekStart.getTime() === currentWeekStart.getTime()
    );
    return foundWeek ? foundWeek.dateString : '';
  }, [currentDate, availableWeeks]);
  
  // Calculer la hauteur totale de la grille horaire
  const totalHeight = useMemo(() => {
    const startMinutes = TIME_CONFIG.startHour * 60 + TIME_CONFIG.startMinute;
    const endMinutes = TIME_CONFIG.endHour * 60 + TIME_CONFIG.endMinute;
    const totalMinutes = endMinutes - startMinutes;
    return (totalMinutes * TIME_CONFIG.hourHeight) / 60;
  }, []);
  
  // Positionnement vertical d'un cours selon son heure de début
  const getClassPosition = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const classStartMinutes = hours * 60 + minutes;
    const scheduleStartMinutes = TIME_CONFIG.startHour * 60 + TIME_CONFIG.startMinute;
    const minutesSinceStart = classStartMinutes - scheduleStartMinutes;
    
    // Si le cours commence avant notre plage d'affichage, le positionner au début
    if (minutesSinceStart < 0) {
      return 0;
    }
    
    return (minutesSinceStart * TIME_CONFIG.hourHeight) / 60;
  };
  
  return (
    <Box sx={{ padding: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: 2,
        marginBottom: 2 
      }}>
        <Typography variant="h5">
          Emploi du temps
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}>
          {/* Sélecteur de semaine */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="week-select-label">Semaine</InputLabel>
            <Select
              labelId="week-select-label"
              id="week-select"
              value={currentWeekValue}
              label="Semaine"
              onChange={handleWeekChange}
              size="small"
              startAdornment={<DateRangeIcon sx={{ mr: 1, color: 'action.active' }} />}
            >
              {availableWeeks.map((week) => (
                <MenuItem key={week.dateString} value={week.dateString}>
                  {week.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={goToPreviousWeek} 
              disabled={isLoading || isAtMinDate}
            >
              <NavigateBeforeIcon />
            </IconButton>
            
            <Button 
              variant="outlined" 
              onClick={goToToday}
              startIcon={<TodayIcon />}
              sx={{ mx: 1 }}
              disabled={isLoading}
            >
              Aujourd'hui
            </Button>
            
            <IconButton 
              onClick={goToNextWeek} 
              disabled={isLoading || isAtMaxDate}
            >
              <NavigateNextIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>
        {weekDays.length > 0 && (
          <>
            {format(weekDays[0], 'dd MMMM', { locale: fr })} - {format(weekDays[weekDays.length - 1], 'dd MMMM yyyy', { locale: fr })}
          </>
        )}
      </Typography>
      
      <Grid container spacing={1}>
        {/* Colonne des heures */}
        <Grid item xs={1}>
          <Paper sx={{ 
            height: `${totalHeight + 60}px`, // +60px pour l'en-tête
            py: 0,
            px: 1,
            position: 'relative',
            mt: '60px' // Espace pour aligner avec les en-têtes des jours
          }}>
            {timeSlots.map((slot, index) => (
              <Typography 
                key={index} 
                variant="caption" 
                sx={{ 
                  position: 'absolute', 
                  right: 8, 
                  top: `${(slot.minutes * TIME_CONFIG.hourHeight) / 60 - 8}px`, // Ajusté pour aligner correctement
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  lineHeight: 1,
                  textAlign: 'right'
                }}
              >
                {slot.label}
              </Typography>
            ))}
          </Paper>
        </Grid>
        
        {/* Colonnes des jours */}
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayClasses = schedule[dateStr] || [];
          
          return (
            <Grid item xs key={dateStr} sx={{ width: `calc((100% - 8.33%) / ${weekDays.length})` }}>
              <Paper 
                sx={{ 
                  height: `${totalHeight + 60}px`, // +60px pour l'en-tête
                  p: 0, 
                  position: 'relative',
                  bgcolor: isToday(day) ? '#f5f9ff' : 'white',
                  border: isToday(day) ? '1px solid #2196f3' : 'none',
                  overflow: 'hidden'
                }}
              >
                {/* En-tête du jour */}
                <Box sx={{ 
                  height: '60px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderBottom: '1px solid #e0e0e0', 
                  backgroundColor: isToday(day) ? '#e3f2fd' : '#f5f5f5'
                }}>
                  <Typography variant="subtitle1" sx={{ textAlign: 'center' }}>
                    {format(day, 'EEEE dd', { locale: fr })}
                  </Typography>
                </Box>
                
                {/* Grille des heures */}
                <Box sx={{ position: 'relative', height: `${totalHeight}px` }}>
                  {timeSlots.map((slot, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        position: 'absolute', 
                        left: 0, 
                        right: 0, 
                        top: `${(slot.minutes * TIME_CONFIG.hourHeight) / 60}px`,
                        borderTop: '1px dashed #e0e0e0',
                        height: 1,
                        zIndex: 1
                      }} 
                    />
                  ))}
                  
                  {/* Afficher les cours positionnés verticalement */}
                  {isLoading ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                      Chargement...
                    </Typography>
                  ) : dayClasses.length > 0 ? (
                    dayClasses.map((classItem, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          position: 'absolute',
                          left: 4,
                          right: 4,
                          top: `${getClassPosition(classItem.startTime)}px`,
                          zIndex: 2
                        }}
                      >
                        <ScheduleItem 
                          classItem={classItem} 
                          hourHeight={TIME_CONFIG.hourHeight}
                        />
                      </Box>
                    ))
                  ) : (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        p: 2, 
                        textAlign: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0.03)',
                        borderRadius: 1,
                        position: 'absolute',
                        top: '50%',
                        left: 16,
                        right: 16,
                        transform: 'translateY(-50%)'
                      }}
                    >
                      {(() => {
                        const holidayInfo = scheduleService.getHolidayInfoForDate(day);
                        if (holidayInfo) {
                          let icon = '🏖️';
                          if (holidayInfo.type === 'bankHoliday') icon = '🗓️';
                          if (holidayInfo.type === 'internship') icon = '👩‍💼';
                          
                          return (
                            <>
                              <Box component="span" sx={{ fontSize: '1.5rem', display: 'block', mb: 1 }}>
                                {icon}
                              </Box>
                              {holidayInfo.name}
                            </>
                          );
                        }
                        return "Pas de cours programmé";
                      })()}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default TimeTableView;