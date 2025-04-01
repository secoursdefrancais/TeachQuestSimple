// src/components/correction/CorrectionView.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  IconButton,
  Divider,
  TextField, 
  Slider,
  Alert,
  Snackbar,
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  List
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import TimerIcon from '@mui/icons-material/Timer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { format } from 'date-fns';

// Importations unifiées depuis le fichier types/index.ts
import { 
  Evaluation, 
  Student, 
} from '../../types';

// Importations des services
import { evaluationService } from '../../services/evaluation.service';
import { studentService } from '../../services/student.service';
import { taskService } from '../../services/task.service';
import { userService } from '../../services/user.service';

// Interfaces locales pour la gestion de l'état
interface GradingCriteria {
  id: string;
  name: string;
  points: number;
  maxPoints: number;
  comment?: string;
  subCriteria?: {
    id: string;
    name: string;
    points: number;
    maxPoints: number;
  }[];
}

interface GradingState {
  evaluationId: string;
  studentId: string;
  criteria: GradingCriteria[];
  comments: string;
  totalPoints: number;
  maxPoints: number;
  gradingTime: number; // en secondes
}

interface CorrectionViewProps {
  evaluationId?: string;
  onClose?: () => void;
  onShowResults?: (evaluationId: string) => void;
}

const CorrectionView: React.FC<CorrectionViewProps> = ({ 
  evaluationId, 
  onClose, 
  onShowResults 
}) => {
  // États
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState('');
  const [gradingState, setGradingState] = useState<GradingState | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showXpDialog, setShowXpDialog] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [xpDetails, setXpDetails] = useState<{
    baseXP: number;
    timeBonus: number;
    accuracyBonus: number;
    total: number;
  }>({
    baseXP: 0,
    timeBonus: 0,
    accuracyBonus: 0,
    total: 0
  });
  
  // Référence au formulaire pour le défilement automatique
  const formRef = useRef<HTMLDivElement>(null);
  
  // Chargement initial de l'évaluation et des élèves
  useEffect(() => {
    const loadEvaluation = async () => {
      if (!evaluationId) {
        if (onClose) onClose();
        return;
      }
      
      try {
        const ev = evaluationService.getEvaluationById(evaluationId);
        if (!ev) {
          console.error("Évaluation non trouvée");
          if (onClose) onClose();
          return;
        }
        
        setEvaluation(ev);
        
        // Récupérer les élèves associés à l'évaluation
        const studentsList = studentService.getStudentsByGroup(ev.group);
        setStudents(studentsList);
        
        // Trouver le premier élève non corrigé
        const firstUncorrectedIndex = ev.copies.findIndex(copy => copy.grade === null);
        setCurrentStudentIndex(firstUncorrectedIndex >= 0 ? firstUncorrectedIndex : 0);
        
        // Charger la structure des critères pour le premier élève
        if (ev.copies.length > 0) {
          const rubric = evaluationService.getRubricById(ev.rubricId);
          if (rubric) {
            // Créer la structure de notation
            const criteriaCopy = rubric.criteria.map(criterion => ({
              id: criterion.id,
              name: criterion.name,
              points: 0,
              maxPoints: criterion.points,
              subCriteria: criterion.subCriteria ? criterion.subCriteria.map(subcrit => ({
                id: subcrit.id,
                name: subcrit.name,
                points: 0,
                maxPoints: subcrit.points
              })) : undefined
            }));
            
            // Initialiser l'état de correction
            setGradingState({
              evaluationId: ev.id,
              studentId: ev.copies[firstUncorrectedIndex >= 0 ? firstUncorrectedIndex : 0].studentId,
              criteria: criteriaCopy,
              comments: '',
              totalPoints: 0,
              maxPoints: rubric.totalPoints,
              gradingTime: 0
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'évaluation:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvaluation();
  }, [evaluationId, onClose]);
  
  // Démarrer le chronomètre de correction
  useEffect(() => {
    if (!loading && gradingState) {
      setStartTime(new Date());
      
      const interval = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          setGradingState(prevState => {
            if (prevState) {
              return { ...prevState, gradingTime: elapsed };
            }
            return prevState;
          });
        }
      }, 1000);
      
      setTimerInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [loading, gradingState]);
  
  // Arrêter le chronomètre lors du nettoyage
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);
  
  // Mettre à jour les points totaux lorsque les critères changent
  useEffect(() => {
    if (gradingState) {
      const total = gradingState.criteria.reduce((sum, criterion) => {
        if (criterion.subCriteria) {
          return sum + criterion.subCriteria.reduce((subSum, subcrit) => 
            subSum + subcrit.points, 0);
        }
        return sum + criterion.points;
      }, 0);
      
      setGradingState(prevState => {
        if (prevState) {
          return { ...prevState, totalPoints: total };
        }
        return prevState;
      });
    }
  }, [gradingState?.criteria]);
  
  // Format du temps en MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Charger les données d'un élève
  const loadStudent = (index: number) => {
    if (!evaluation || !students[index]) return;
    
    // Vérifier si une note existe déjà
    const copy = evaluation.copies.find(c => c.studentId === students[index].id);
    const rubric = evaluationService.getRubricById(evaluation.rubricId);
    
    if (copy && rubric) {
      let criteriaCopy = [];
      
      // Si l'élève a déjà été noté, charger ses notes
      if (copy.grade !== null && copy.details && copy.details.length > 0) {
        criteriaCopy = rubric.criteria.map((criterion, i) => {
          const savedCriterion = copy.details && copy.details[i];
          
          if (criterion.subCriteria && savedCriterion && savedCriterion.subCriteria) {
            return {
              id: criterion.id,
              name: criterion.name,
              points: savedCriterion.points || 0,
              maxPoints: criterion.points,
              subCriteria: criterion.subCriteria.map((subcrit, j) => ({
                id: subcrit.id,
                name: subcrit.name,
                points: savedCriterion.subCriteria && savedCriterion.subCriteria[j] ? 
                  savedCriterion.subCriteria[j].points : 0,
                maxPoints: subcrit.points
              }))
            };
          }
          
          return {
            id: criterion.id,
            name: criterion.name,
            points: savedCriterion ? savedCriterion.points : 0,
            maxPoints: criterion.points,
            subCriteria: criterion.subCriteria ? criterion.subCriteria.map(subcrit => ({
              id: subcrit.id,
              name: subcrit.name,
              points: 0,
              maxPoints: subcrit.points
            })) : undefined
          };
        });
      } else {
        // Sinon, créer une nouvelle structure vide
        criteriaCopy = rubric.criteria.map(criterion => ({
          id: criterion.id,
          name: criterion.name,
          points: 0,
          maxPoints: criterion.points,
          subCriteria: criterion.subCriteria ? criterion.subCriteria.map(subcrit => ({
            id: subcrit.id,
            name: subcrit.name,
            points: 0,
            maxPoints: subcrit.points
          })) : undefined
        }));
      }
      
      setGradingState({
        evaluationId: evaluation.id,
        studentId: students[index].id,
        criteria: criteriaCopy,
        comments: copy.comments || '',
        totalPoints: copy.grade || 0,
        maxPoints: rubric.totalPoints,
        gradingTime: 0
      });
      
      // Réinitialiser le chronomètre
      if (timerInterval) clearInterval(timerInterval);
      setStartTime(new Date());
      
      const interval = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          setGradingState(prevState => {
            if (prevState) {
              return { ...prevState, gradingTime: elapsed };
            }
            return prevState;
          });
        }
      }, 1000);
      
      setTimerInterval(interval);
      
      // Faire défiler vers le haut du formulaire
      if (formRef.current) {
        formRef.current.scrollTop = 0;
      }
    }
  };
  
  // Naviguer vers l'élève précédent
  const handlePrevStudent = () => {
    if (currentStudentIndex > 0) {
      setCurrentStudentIndex(currentStudentIndex - 1);
      loadStudent(currentStudentIndex - 1);
    }
  };
  
  // Naviguer vers l'élève suivant
  const handleNextStudent = async () => {
    if (currentStudentIndex < students.length - 1) {
      // Sauvegarder les notes de l'élève actuel avant de passer au suivant
      await handleSaveGrade();
      
      setCurrentStudentIndex(currentStudentIndex + 1);
      loadStudent(currentStudentIndex + 1);
    }
  };
  
  // Mettre à jour la note d'un critère
  const handleCriterionChange = (criterionId: string, value: number) => {
    setGradingState(prevState => {
      if (!prevState) return null;
      
      const updatedCriteria = prevState.criteria.map(criterion => {
        if (criterion.id === criterionId) {
          return { ...criterion, points: value };
        }
        return criterion;
      });
      
      return { ...prevState, criteria: updatedCriteria };
    });
  };
  
  // Mettre à jour la note d'un sous-critère
  const handleSubCriterionChange = (criterionId: string, subCriterionId: string, value: number) => {
    setGradingState(prevState => {
      if (!prevState) return null;
      
      const updatedCriteria = prevState.criteria.map(criterion => {
        if (criterion.id === criterionId && criterion.subCriteria) {
          const updatedSubCriteria = criterion.subCriteria.map(subcrit => {
            if (subcrit.id === subCriterionId) {
              return { ...subcrit, points: value };
            }
            return subcrit;
          });
          
          // Calculer le total des points des sous-critères
          const totalSubPoints = updatedSubCriteria.reduce((sum, subcrit) => sum + subcrit.points, 0);
          
          return { 
            ...criterion, 
            points: totalSubPoints, // Mettre à jour les points du critère parent
            subCriteria: updatedSubCriteria 
          };
        }
        return criterion;
      });
      
      return { ...prevState, criteria: updatedCriteria };
    });
  };
  
  // Mettre à jour les commentaires
  const handleCommentsChange = (value: string) => {
    setGradingState(prevState => {
      if (!prevState) return null;
      return { ...prevState, comments: value };
    });
  };
  
  // Sauvegarder la note
  const handleSaveGrade = async () => {
    if (!evaluation || !gradingState) return;
    
    setSavingStatus('saving');
    
    try {
      // Préparer les données pour la sauvegarde
      const gradeData = {
        studentId: gradingState.studentId,
        grade: gradingState.totalPoints,
        comments: gradingState.comments,
        details: gradingState.criteria.map(criterion => ({
          id: criterion.id,
          points: criterion.points,
          subCriteria: criterion.subCriteria ? criterion.subCriteria.map(subcrit => ({
            id: subcrit.id,
            points: subcrit.points
          })) : undefined
        }))
      };
      
      // Sauvegarder la note
      const updatedEvaluation = evaluationService.saveGrade(evaluation.id, gradeData);
      setEvaluation(updatedEvaluation);
      
      // Vérifier si c'est la première sauvegarde pour cet élève
      const previousCopy = evaluation.copies.find(c => c.studentId === gradingState.studentId);
      const isFirstSave = previousCopy && previousCopy.grade === null;
      
      // Calculer les points XP si c'est la première sauvegarde
      if (isFirstSave) {
        // Récupérer la catégorie de tâche pour la correction
        const correctionCategory = taskService.getTaskCategories().find(cat => 
          cat.name.toLowerCase().includes('correction'));
        
        if (correctionCategory) {
          // Base XP pour chaque copie corrigée
          const baseXP = correctionCategory.xpValue;
          
          // Bonus pour la rapidité (max 50% bonus si moins de 2 minutes par copie)
          const expectedTimePerCopy = 5 * 60; // 5 minutes en secondes
          const timeBonus = Math.max(0, Math.min(baseXP * 0.5, 
            baseXP * 0.5 * (1 - gradingState.gradingTime / expectedTimePerCopy)));
          
          // Bonus pour la précision/détail (basé sur l'utilisation des critères et commentaires)
          const usedCriteriaRatio = gradingState.criteria.filter(c => c.points > 0).length / gradingState.criteria.length;
          const hasDetailedComments = gradingState.comments.length > 20;
          const accuracyBonus = baseXP * 0.3 * (usedCriteriaRatio + (hasDetailedComments ? 0.5 : 0));
          
          // Total des points XP
          const totalXP = Math.round(baseXP + timeBonus + accuracyBonus);
          
          // Mettre à jour les détails XP pour la boîte de dialogue
          setXpDetails({
            baseXP,
            timeBonus: Math.round(timeBonus),
            accuracyBonus: Math.round(accuracyBonus),
            total: totalXP
          });
          
          // Ajouter les points XP à l'utilisateur
          userService.addXP(totalXP);
          setEarnedXP(totalXP);
          
          // Afficher la boîte de dialogue des XP
          setShowXpDialog(true);
        }
      }
      
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus(''), 2000);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la note:", error);
      setSavingStatus('error');
      setTimeout(() => setSavingStatus(''), 3000);
    }
  };
  
  // Fermer la boîte de dialogue des XP
  const handleCloseXpDialog = () => {
    setShowXpDialog(false);
  };
  
  // Obtenir l'élève actuel
  const currentStudent = students[currentStudentIndex];
  
  // Gérer le retour vers la liste des évaluations
  const handleClose = () => {
    if (onClose) onClose();
  };
  
  // Voir les résultats de l'évaluation
  const handleViewResults = () => {
    if (evaluation && onShowResults) {
      onShowResults(evaluation.id);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!evaluation || !gradingState || !currentStudent) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Impossible de charger les données de l'évaluation.
        </Alert>
        <Button 
          variant="contained" 
          onClick={handleClose}
          sx={{ mt: 2 }}
        >
          Retour à la liste
        </Button>
      </Box>
    );
  }
  
  // Calculer le pourcentage de progression
  const progress = (evaluation.copies.filter(c => c.grade !== null).length / evaluation.copies.length) * 100;
  
  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {evaluation.name}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Chip 
                label={evaluation.subject} 
                color="primary" 
                size="small"
              />
              <Chip 
                label={evaluation.group} 
                color="secondary" 
                size="small"
                icon={<SchoolIcon />}
              />
              <Chip 
                label={format(new Date(evaluation.date), 'dd MMMM yyyy')}
                size="small"
                variant="outlined"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Barème: {evaluation.maxPoints} points
                </Typography>
                <Tooltip title="Voir le détail du barème">
                  <IconButton size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Progression:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary">
                {evaluation.copies.filter(c => c.grade !== null).length}/{evaluation.copies.length} copies
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                ({progress.toFixed(0)}%)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={2}>
        {/* Formulaire de correction */}
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 2, 
              height: '70vh', 
              overflowY: 'auto',
              position: 'relative' 
            }}
            ref={formRef}
          >
            <Box sx={{ 
              position: 'sticky', 
              top: 0, 
              bgcolor: 'background.paper', 
              pt: 1, 
              pb: 2, 
              zIndex: 1 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">
                  {currentStudent.firstName} {currentStudent.lastName}
                </Typography>
                <Badge 
                  badgeContent={`${gradingState.totalPoints}/${gradingState.maxPoints}`} 
                  color="primary"
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{ '.MuiBadge-badge': { fontSize: '0.8rem', px: 1 } }}
                >
                  <Chip 
                    icon={<TimerIcon />} 
                    label={formatTime(gradingState.gradingTime)} 
                    size="small" 
                    color="default"
                    variant="outlined"
                  />
                </Badge>
              </Box>
              
              <Box sx={{ width: '100%', height: 10, bgcolor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    width: `${(gradingState.totalPoints / gradingState.maxPoints) * 100}%`, 
                    height: '100%', 
                    bgcolor: (gradingState.totalPoints / gradingState.maxPoints) >= 0.5 ? 'success.main' : 'warning.main',
                    transition: 'width 0.3s'
                  }} 
                />
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {/* Critères de notation */}
            {gradingState.criteria.map((criterion, index) => (
              <Box key={criterion.id} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {criterion.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {criterion.points}/{criterion.maxPoints} points
                  </Typography>
                </Box>
                
                {criterion.subCriteria ? (
                  // Afficher les sous-critères
                  <Box sx={{ ml: 2 }}>
                    {criterion.subCriteria.map(subcrit => (
                      <Box key={subcrit.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2">
                            {subcrit.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {subcrit.points}/{subcrit.maxPoints}
                          </Typography>
                        </Box>
                        
                        <Slider
                          value={subcrit.points}
                          onChange={(e, value) => handleSubCriterionChange(criterion.id, subcrit.id, value as number)}
                          step={0.5}
                          min={0}
                          max={subcrit.maxPoints}
                          valueLabelDisplay="auto"
                          marks={[
                            { value: 0, label: '0' },
                            { value: subcrit.maxPoints, label: subcrit.maxPoints.toString() }
                          ]}
                          sx={{ ml: 0.5, width: 'calc(100% - 8px)' }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  // Afficher un slider pour le critère principal
                  <Slider
                    value={criterion.points}
                    onChange={(e, value) => handleCriterionChange(criterion.id, value as number)}
                    step={0.5}
                    min={0}
                    max={criterion.maxPoints}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 0, label: '0' },
                      { value: criterion.maxPoints, label: criterion.maxPoints.toString() }
                    ]}
                  />
                )}
              </Box>
            ))}
            
            {/* Commentaires */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Commentaires
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Commentaires pour l'élève..."
                value={gradingState.comments}
                onChange={(e) => handleCommentsChange(e.target.value)}
                variant="outlined"
              />
            </Box>
            
            {/* Bouton de sauvegarde */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveGrade}
                disabled={savingStatus === 'saving'}
              >
                {savingStatus === 'saving' ? 'Sauvegarde en cours...' : 'Sauvegarder la note'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Panneau latéral */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Résumé
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Note actuelle:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold' }}>
                  {gradingState.totalPoints}
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ ml: 1 }}>
                  /{gradingState.maxPoints}
                </Typography>
              </Box>
              <Typography variant="body1" textAlign="center" color="text.secondary">
                {((gradingState.totalPoints / gradingState.maxPoints) * 20).toFixed(1)}/20
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Élèves à corriger
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton 
                onClick={handlePrevStudent}
                disabled={currentStudentIndex === 0}
              >
                <NavigateBeforeIcon />
              </IconButton>
              
              <Typography>
                {currentStudentIndex + 1} / {students.length}
              </Typography>
              
              <IconButton 
                onClick={handleNextStudent}
                disabled={currentStudentIndex === students.length - 1}
              >
                <NavigateNextIcon />
              </IconButton>
            </Box>
            
            <List
              sx={{ 
                maxHeight: '25vh', 
                overflowY: 'auto', 
                border: '1px solid #eee',
                borderRadius: 1,
                mb: 2 
              }}
            >
              {students.map((student, index) => {
                const copy = evaluation.copies.find(c => c.studentId === student.id);
                const isCorrected = copy && copy.grade !== null;
                
                return (
                  <Box 
                    key={student.id}
                    sx={{ 
                      px: 2, 
                      py: 1, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      bgcolor: currentStudentIndex === index ? '#f0f7ff' : 'transparent',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: currentStudentIndex === index ? '#f0f7ff' : '#f5f5f5'
                      }
                    }}
                    onClick={() => {
                      setCurrentStudentIndex(index);
                      loadStudent(index);
                    }}
                  >
                    <Typography variant="body2">
                      {student.firstName} {student.lastName}
                    </Typography>
                    
                    {isCorrected ? (
                      <Chip 
                        label={`${copy.grade}/${gradingState.maxPoints}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip 
                        label="À corriger"
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </Box>
                );
              })}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleViewResults}
                fullWidth
              >
                Voir le résumé de l'évaluation
              </Button>
            </Box>
          </Paper>
          
          {/* Carte de statistiques */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistiques de correction
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Temps moyen
                  </Typography>
                  <Typography variant="h6">
                    {formatTime(gradingState.gradingTime)}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Moyenne
                  </Typography>
                  <Typography variant="h6">
                    {evaluation.copies.filter(c => c.grade !== null).length > 0 
                      ? (evaluation.copies.reduce((sum, c) => sum + (c.grade || 0), 0) / 
                         evaluation.copies.filter(c => c.grade !== null).length).toFixed(1)
                      : "N/A"}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Restant
                  </Typography>
                  <Typography variant="h6">
                    {evaluation.copies.filter(c => c.grade === null).length}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Terminé
                  </Typography>
                  <Typography variant="h6">
                    {evaluation.copies.filter(c => c.grade !== null).length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Feedback de sauvegarde */}
      <Snackbar
        open={savingStatus === 'saved' || savingStatus === 'error'}
        autoHideDuration={3000}
        onClose={() => setSavingStatus('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={savingStatus === 'saved' ? 'success' : 'error'} 
          variant="filled"
        >
          {savingStatus === 'saved' 
            ? 'Note sauvegardée avec succès !' 
            : 'Erreur lors de la sauvegarde. Veuillez réessayer.'}
        </Alert>
      </Snackbar>
      
      {/* Boîte de dialogue des XP gagnés */}
      <Dialog
        open={showXpDialog}
        onClose={handleCloseXpDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <EmojiEventsIcon fontSize="large" color="primary" sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="h5" component="div">
            Félicitations !
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
              +{xpDetails.total} XP
            </Typography>
            <Typography variant="body1">
              Vous avez gagné des points d'expérience pour cette correction !
            </Typography>
          </Box>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Détail des points gagnés :
            </Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={8}>
                <Typography variant="body2">Base pour la correction :</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight="bold">
                  {xpDetails.baseXP} XP
                </Typography>
              </Grid>
              
              <Grid item xs={8}>
                <Typography variant="body2">Bonus de rapidité :</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  +{xpDetails.timeBonus} XP
                </Typography>
              </Grid>
              
              <Grid item xs={8}>
                <Typography variant="body2">Bonus de précision :</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  +{xpDetails.accuracyBonus} XP
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={8}>
                <Typography variant="body1" fontWeight="bold">Total :</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {xpDetails.total} XP
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={handleCloseXpDialog} 
            variant="contained"
            color="primary"
          >
            Super !
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CorrectionView;