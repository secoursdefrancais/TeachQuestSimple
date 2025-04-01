// src/components/schedule/ScheduleView.tsx

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
import AddIcon from '@mui/icons-material/Add';
import DateRangeIcon from '@mui/icons-material/DateRange';

import { scheduleService, ScheduleClass } from '../../services/schedule.service';
import { taskService } from '../../services/task.service';
import { Task } from '../../types';
import ScheduleItem from './ScheduleItem';
import TaskItem from '../tasks/TaskItem';
import { TaskDialog } from '../tasks/TaskDialog';

// Dates limites de l'application
const MIN_DATE = new Date(2025, 2, 9); // 9 mars 2025
const MAX_DATE = new Date(2025, 5, 30); // 30 juin 2025

export const ScheduleView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [schedule, setSchedule] = useState<Record<string, ScheduleClass[]>>({});
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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

      // Récupérer les tâches pour chaque jour avec gestion d'erreur
      const loadTasks = async () => {
        const weekTasks: Record<string, Task[]> = {};

        for (const day of days.slice(0, 5)) {
          const dateStr = format(day, 'yyyy-MM-dd');
          try {
            weekTasks[dateStr] = taskService.getTasksForDate(day);
          } catch (error) {
            console.error(`Erreur lors de la récupération des tâches pour ${dateStr}:`, error);

            // Tenter de recharger les données de tâches
            try {
              taskService.reloadData();
              weekTasks[dateStr] = taskService.getTasksForDate(day);
            } catch {
              weekTasks[dateStr] = [];
            }
          }
        }

        if (mounted) setTasks(weekTasks);
      };

      loadTasks();

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

  // Ouvrir le dialogue de création de tâche
  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setEditingTask(null);
    setIsTaskDialogOpen(true);
  };

  // Gérer la création d'une nouvelle tâche
  const handleTaskCreate = (taskData: Partial<Task>) => {
    try {
      const newTask = taskService.createTask(taskData);

      // Mettre à jour les tâches affichées
      const updatedTasks = { ...tasks };
      const dateStr = taskData.dueDate || format(new Date(), 'yyyy-MM-dd');

      if (updatedTasks[dateStr]) {
        updatedTasks[dateStr] = [...updatedTasks[dateStr], newTask as Task];
      } else {
        updatedTasks[dateStr] = [newTask as Task];
      }

      setTasks(updatedTasks);
      setIsTaskDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création de la tâche:', error);
      setError("Impossible de créer la tâche. Veuillez réessayer.");
    }
  };

  // Rafraîchir les tâches après mise à jour
  const handleTaskUpdate = () => {
    try {
      const updatedTasks: Record<string, Task[]> = {};
      weekDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        updatedTasks[dateStr] = taskService.getTasksForDate(day);
      });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tâches:', error);

      // Tentative de récupération
      try {
        taskService.reloadData();
        // Réessayer de charger les tâches
        const retryTasks: Record<string, Task[]> = {};
        weekDays.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          retryTasks[dateStr] = taskService.getTasksForDate(day);
        });
        setTasks(retryTasks);
      } catch {
        // Si la récupération échoue également, ne pas mettre à jour l'interface
        setError("Impossible de rafraîchir les tâches. Veuillez recharger la page.");
      }
    }
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
          Planning
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

      <Grid container spacing={2}>
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayClasses = schedule[dateStr] || [];
          const dayTasks = tasks[dateStr] || [];

          return (
            <Grid item xs={12} md={12 / weekDays.length} key={dateStr}>
              <Paper
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: isToday(day) ? '#f5f9ff' : 'white',
                  border: isToday(day) ? '1px solid #2196f3' : 'none'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    {format(day, 'EEEE dd', { locale: fr })}
                  </Typography>

                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleAddTask(day)}
                    disabled={isLoading}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>

                <Divider sx={{ mb: 1 }} />

                {/* Afficher les cours */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Cours
                  </Typography>

                  {isLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Chargement...
                    </Typography>
                  ) : dayClasses.length > 0 ? (
                    dayClasses.map((classItem, index) => (
                      <ScheduleItem key={index} classItem={classItem} />
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0.03)',
                        borderRadius: 1
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

                <Divider sx={{ mb: 1 }} />

                {/* Afficher les tâches */}
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tâches
                  </Typography>

                  {isLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Chargement...
                    </Typography>
                  ) : dayTasks.length > 0 ? (
                    dayTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onStatusChange={(newStatus) => {
                          // Gérer le changement de statut
                          try {
                            // Mettre à jour le statut de la tâche
                            const updatedTask = {
                              ...task,
                              status: newStatus,
                              completionDate: newStatus === 'completed' ? format(new Date(), 'yyyy-MM-dd') : undefined
                            };

                            taskService.updateTask(updatedTask);

                            // Rafraîchir les tâches
                            handleTaskUpdate();
                          } catch (error) {
                            console.error("Erreur lors de la mise à jour du statut:", error);
                            setError("Impossible de mettre à jour le statut. Veuillez réessayer.");
                          }
                        }}
                        onEdit={() => {
                          // Ouvrir le dialogue d'édition
                          setSelectedDate(parseISO(task.dueDate));
                          setEditingTask(task);
                          setIsTaskDialogOpen(true);
                        }}
                        onDelete={() => {
                          // Supprimer la tâche
                          try {
                            taskService.deleteTask(task.id);
                            handleTaskUpdate();
                          } catch (error) {
                            console.error("Erreur lors de la suppression de la tâche:", error);
                            setError("Impossible de supprimer la tâche. Veuillez réessayer.");
                          }
                        }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Pas de tâche
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Dialogue de création/édition de tâche */}
      <TaskDialog
        open={isTaskDialogOpen}
        onClose={() => {
          setIsTaskDialogOpen(false);
          setEditingTask(null);  // Réinitialiser la tâche en édition
        }}
        onSave={(taskData) => {
          if (editingTask) {
            // Mise à jour d'une tâche existante
            try {
              const updatedTask = {
                ...editingTask,
                ...taskData
              };
              taskService.updateTask(updatedTask as Task);
              handleTaskUpdate();
              setIsTaskDialogOpen(false);
            } catch (error) {
              console.error("Erreur lors de la mise à jour de la tâche:", error);
              setError("Impossible de mettre à jour la tâche. Veuillez réessayer.");
            }
          } else {
            // Création d'une nouvelle tâche
            handleTaskCreate(taskData);
          }
          setEditingTask(null);  // Réinitialiser la tâche en édition
        }}
        initialTask={editingTask as Task}
        initialDate={selectedDate}
      />
    </Box>
  );
};

export default ScheduleView;