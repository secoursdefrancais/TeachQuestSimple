// src/components/dashboard/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Avatar,
  Button
} from '@mui/material';
import { 
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Today as TodayIcon,
  EmojiEvents as EmojiEventsIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { format, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Task } from '../../types';
import { taskService } from '../../services/task.service';
import { evaluationService } from '../../services/evaluation.service';
import { userService } from '../../services/user.service';
import { scheduleService } from '../../services/schedule.service';

const Dashboard: React.FC = () => {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [pendingEvaluations, setPendingEvaluations] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    xpForNextLevel: 100,
    progress: 0,
    tasksCompleted: 0,
    evaluationsCorrected: 0
  });
  
  useEffect(() => {
    // Charger les tâches à venir
    const tasks = taskService.getUpcomingTasks(7);
    setUpcomingTasks(tasks);
    
    // Charger les évaluations en attente de correction
    const evaluations = evaluationService.getAllEvaluations();
    const pendingEvals = evaluations.filter(e => {
      const progress = getEvaluationProgress(e);
      return progress < 100;
    });
    setPendingEvaluations(pendingEvals);
    
    // Charger les cours d'aujourd'hui
    const today = new Date();
    const classes = scheduleService.getScheduleForDate(today);
    setTodayClasses(classes);
    
    // Charger les statistiques utilisateur
    const user = userService.getUserProfile();
    const progression = userService.getProgressionStatus();
    if (user) {
      setUserStats({
        level: progression.level,
        xp: progression.currentXP,
        xpForNextLevel: progression.xpForNextLevel,
        progress: progression.progress,
        tasksCompleted: user.stats.tasksCompleted,
        evaluationsCorrected: countCorrectedEvaluations(evaluations)
      });
    }
  }, []);
  
  // Compter le nombre total de copies corrigées
  const countCorrectedEvaluations = (evaluations: any[]) => {
    return evaluations.reduce((count, ev) => {
      return count + ev.copies.filter((copy: any) => copy.grade !== null).length;
    }, 0);
  };
  
  // Calculer le taux de progression d'une évaluation
  const getEvaluationProgress = (evaluation: any): number => {
    if (!evaluation.copies || evaluation.copies.length === 0) {
      return 0;
    }
    
    const correctedCopies = evaluation.copies.filter((copy: any) => copy.grade !== null);
    return (correctedCopies.length / evaluation.copies.length) * 100;
  };
  
  // Formater une date pour l'affichage
  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) {
      return { text: `En retard - ${format(date, 'dd/MM/yyyy')}`, isLate: true };
    } else if (date.getTime() === today.getTime()) {
      return { text: "Aujourd'hui", isLate: false };
    } else {
      return { text: format(date, 'EEEE dd MMMM', { locale: fr }), isLate: false };
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de bord
      </Typography>
      
      {/* Niveau et progression */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 'bold' 
                }}
              >
                {userStats.level}
              </Avatar>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Niveau {userStats.level}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userStats.xp} / {userStats.xpForNextLevel} XP
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={userStats.progress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">{userStats.tasksCompleted}</Typography>
                <Typography variant="body2" color="text.secondary">Tâches</Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5">{userStats.evaluationsCorrected}</Typography>
                <Typography variant="body2" color="text.secondary">Copies</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        {/* Tâches à venir */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Tâches à venir" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<AssignmentIcon color="primary" />}
              action={
                <Button size="small" href="#/tasks">
                  Voir tout
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {upcomingTasks.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucune tâche à venir dans les 7 prochains jours
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {upcomingTasks.map(task => {
                    const { text, isLate } = formatDueDate(task.dueDate);
                    return (
                      <ListItem key={task.id} divider>
                        <ListItemText
                          primary={task.name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <TodayIcon fontSize="small" />
                              <Typography 
                                variant="caption" 
                                color={isLate ? 'error' : 'text.secondary'}
                              >
                                {text}
                              </Typography>
                              {task.priority <= 2 && (
                                <Chip 
                                  label="Prioritaire" 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Évaluations à corriger */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Évaluations à corriger" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<SchoolIcon color="secondary" />}
              action={
                <Button size="small" href="#/tasks">
                  Voir tout
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {pendingEvaluations.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Toutes les évaluations sont corrigées
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {pendingEvaluations.map(evaluation => {
                    const progress = getEvaluationProgress(evaluation);
                    const correctedCount = evaluation.copies.filter((c: any) => c.grade !== null).length;
                    return (
                      <ListItem key={evaluation.id} divider>
                        <ListItemText
                          primary={evaluation.name}
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {evaluation.subject} - {evaluation.group}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption">
                                  {correctedCount}/{evaluation.copies.length} copies
                                </Typography>
                                <Typography variant="caption">
                                  {progress.toFixed(0)}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={progress} 
                                sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Emploi du temps d'aujourd'hui */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Cours aujourd'hui" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<TimerIcon color="info" />}
              action={
                <Button size="small" href="#/timetable">
                  Emploi du temps
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {todayClasses.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Pas de cours programmé aujourd'hui
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {todayClasses
                    .sort((a, b) => {
                      const timeA = a.startTime.split(':').map(Number);
                      const timeB = b.startTime.split(':').map(Number);
                      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                    })
                    .map((classItem, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {classItem.subject}
                              </Typography>
                              <Typography variant="body2">
                                {classItem.startTime} - {classItem.endTime}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {classItem.group} • {classItem.room || 'Salle non spécifiée'}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))
                  }
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Activité récente */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Statistiques rapides" 
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<EmojiEventsIcon color="success" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {userStats.tasksCompleted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tâches accomplies
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                    <Typography variant="h5" fontWeight="bold" color="secondary">
                      {userStats.evaluationsCorrected}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Copies corrigées
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {pendingEvaluations.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Évaluations en attente
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {userStats.level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Niveau actuel
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;