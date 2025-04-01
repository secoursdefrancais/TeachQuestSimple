import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Chip,
  IconButton,
  FormControlLabel,
  Switch,
  TableSortLabel,
  TextField,
  InputAdornment,
  Theme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GetAppIcon from '@mui/icons-material/GetApp';
import { Evaluation, Student, Rubric, RubricCriterion } from '../../types';
import { evaluationService } from '../../services/evaluation.service';
import { downloadDetailedEvaluationGrid } from '../../utils/evaluationExportUtils';

interface EvaluationDetailedGridProps {
  evaluation: Evaluation;
  students: Student[];
}

// Définir l'interface pour les colonnes de critères
interface CriterionColumn {
  id: string;
  label: string;
  fullLabel: string;
  maxPoints: number;
  parentName: string | null; // Peut être null ou string
}

type SortDirection = 'asc' | 'desc';

const EvaluationDetailedGrid: React.FC<EvaluationDetailedGridProps> = ({ evaluation, students }) => {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [showEmptyRows, setShowEmptyRows] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('lastName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Charger le barème
  useEffect(() => {
    const loadRubric = () => {
      const rubricData = evaluationService.getRubricById(evaluation.rubricId);
      setRubric(rubricData);
    };
    
    loadRubric();
  }, [evaluation]);
  
  if (!rubric) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">
          Impossible de charger le barème pour cette évaluation.
        </Typography>
      </Box>
    );
  }
  
  // Générer les en-têtes de colonnes pour les critères en utilisant une fonction mappée explicitement
  const criteriaColumns: CriterionColumn[] = [];
  
  // Remplir les colonnes de critères
  rubric.criteria.forEach((criterion: RubricCriterion) => {
    if (criterion.subCriteria && criterion.subCriteria.length > 0) {
      // Si le critère a des sous-critères, générer une colonne pour chaque sous-critère
      criterion.subCriteria.forEach(subCriterion => {
        criteriaColumns.push({
          id: `${criterion.id}_${subCriterion.id}`,
          label: `${subCriterion.name}`,
          fullLabel: `${criterion.name} - ${subCriterion.name}`,
          maxPoints: subCriterion.points,
          parentName: criterion.name
        });
      });
    } else {
      // Sinon, générer juste une colonne pour le critère
      criteriaColumns.push({
        id: criterion.id,
        label: criterion.name,
        fullLabel: criterion.name,
        maxPoints: criterion.points,
        parentName: null
      });
    }
  });
  
  // Filtrer les étudiants selon la recherche et l'option d'affichage des lignes vides
  const filteredStudents = students.filter(student => {
    // Vérifier si l'étudiant a une copie avec une note
    const hasCopy = evaluation.copies.some(copy => 
      copy.studentId === student.id && copy.grade !== null
    );
    
    // Si on n'affiche pas les lignes vides et que l'étudiant n'a pas de note, le filtrer
    if (!showEmptyRows && !hasCopy) {
      return false;
    }
    
    // Si une recherche est active, filtrer par nom/prénom
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        student.lastName.toLowerCase().includes(query) ||
        student.firstName.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Trier les étudiants
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'lastName') {
      return sortDirection === 'asc' 
        ? a.lastName.localeCompare(b.lastName)
        : b.lastName.localeCompare(a.lastName);
    }
    
    if (sortBy === 'firstName') {
      return sortDirection === 'asc'
        ? a.firstName.localeCompare(b.firstName)
        : b.firstName.localeCompare(a.firstName);
    }
    
    if (sortBy === 'total') {
      const gradeA = evaluation.copies.find(c => c.studentId === a.id)?.grade || 0;
      const gradeB = evaluation.copies.find(c => c.studentId === b.id)?.grade || 0;
      
      return sortDirection === 'asc' ? gradeA - gradeB : gradeB - gradeA;
    }
    
    // Tri par un critère spécifique
    if (sortBy.startsWith('criterion_')) {
      const criterionId = sortBy.replace('criterion_', '');
      
      const getStudentCriterionPoints = (student: Student, criterionId: string) => {
        const copy = evaluation.copies.find(c => c.studentId === student.id);
        if (!copy || copy.grade === null) return 0;
        
        // Vérifier s'il s'agit d'un critère principal ou d'un sous-critère
        const [mainCriterionId, subCriterionId] = criterionId.split('_');
        
        const criterionDetail = copy.details?.find(d => d.id === mainCriterionId);
        if (!criterionDetail) return 0;
        
        if (subCriterionId) {
          // C'est un sous-critère
          return criterionDetail.subCriteria?.find(sc => sc.id === subCriterionId)?.points || 0;
        } else {
          // C'est un critère principal
          return criterionDetail.points;
        }
      };
      
      const pointsA = getStudentCriterionPoints(a, criterionId);
      const pointsB = getStudentCriterionPoints(b, criterionId);
      
      return sortDirection === 'asc' ? pointsA - pointsB : pointsB - pointsA;
    }
    
    return 0;
  });
  
  // Fonction pour récupérer les points d'un critère pour un étudiant
  const getStudentCriterionPoints = (studentId: string, criterionId: string): number => {
    const copy = evaluation.copies.find(c => c.studentId === studentId);
    if (!copy || copy.grade === null) return 0;
    
    // Vérifier s'il s'agit d'un critère principal ou d'un sous-critère
    const [mainCriterionId, subCriterionId] = criterionId.split('_');
    
    const criterionDetail = copy.details?.find(d => d.id === mainCriterionId);
    if (!criterionDetail) return 0;
    
    if (subCriterionId) {
      // C'est un sous-critère
      return criterionDetail.subCriteria?.find(sc => sc.id === subCriterionId)?.points || 0;
    } else {
      // C'est un critère principal sans sous-critères
      return criterionDetail.points;
    }
  };
  
  // Gérer le changement de tri
  const handleRequestSort = (property: string) => {
    const isAsc = sortBy === property && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortBy(property);
  };
  
  // Exporter la grille détaillée
  const handleExportGrid = () => {
    downloadDetailedEvaluationGrid(evaluation, students, showEmptyRows);
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">
          Grille détaillée : {evaluation.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher un élève..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showEmptyRows}
                onChange={(e) => setShowEmptyRows(e.target.checked)}
                size="small"
              />
            }
            label="Afficher tous les élèves"
          />
          
          <Tooltip title="Exporter cette grille">
            <IconButton onClick={handleExportGrid}>
              <GetAppIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {/* En-têtes des informations élèves */}
              <TableCell 
                sx={{ 
                  minWidth: 120, 
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 3,
                  backgroundColor: 'background.paper' 
                }}
              >
                <TableSortLabel
                  active={sortBy === 'lastName'}
                  direction={sortBy === 'lastName' ? sortDirection : 'asc'}
                  onClick={() => handleRequestSort('lastName')}
                >
                  Nom
                </TableSortLabel>
              </TableCell>
              
              <TableCell 
                sx={{ 
                  minWidth: 120, 
                  position: 'sticky', 
                  left: 120, 
                  zIndex: 3,
                  backgroundColor: 'background.paper'
                }}
              >
                <TableSortLabel
                  active={sortBy === 'firstName'}
                  direction={sortBy === 'firstName' ? sortDirection : 'asc'}
                  onClick={() => handleRequestSort('firstName')}
                >
                  Prénom
                </TableSortLabel>
              </TableCell>
              
              {/* En-têtes des critères */}
              {criteriaColumns.map((column) => (
                <TableCell 
                  key={column.id}
                  align="center"
                  sx={{ 
                    whiteSpace: 'nowrap',
                    minWidth: 100
                  }}
                >
                  <Tooltip 
                    title={
                      <>
                        <Typography variant="subtitle2">{column.fullLabel}</Typography>
                        <Typography variant="body2">
                          {column.maxPoints} point{column.maxPoints > 1 ? 's' : ''}
                        </Typography>
                        {column.parentName && (
                          <Typography variant="caption">
                            Critère parent: {column.parentName}
                          </Typography>
                        )}
                      </>
                    }
                    arrow
                  >
                    <TableSortLabel
                      active={sortBy === `criterion_${column.id}`}
                      direction={sortBy === `criterion_${column.id}` ? sortDirection : 'asc'}
                      onClick={() => handleRequestSort(`criterion_${column.id}`)}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                          {column.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          ({column.maxPoints} pts)
                        </Typography>
                      </Box>
                    </TableSortLabel>
                  </Tooltip>
                </TableCell>
              ))}
              
              {/* En-tête du total */}
              <TableCell 
                align="center"
                sx={{ 
                  position: 'sticky', 
                  right: 80, 
                  zIndex: 2,
                  backgroundColor: 'background.paper',
                  fontWeight: 'bold',
                  minWidth: 80
                }}
              >
                <TableSortLabel
                  active={sortBy === 'total'}
                  direction={sortBy === 'total' ? sortDirection : 'asc'}
                  onClick={() => handleRequestSort('total')}
                >
                  Total
                </TableSortLabel>
              </TableCell>
              
              {/* En-tête de la note sur 20 */}
              <TableCell 
                align="center"
                sx={{ 
                  position: 'sticky', 
                  right: 0, 
                  zIndex: 2,
                  backgroundColor: 'background.paper',
                  fontWeight: 'bold',
                  minWidth: 80
                }}
              >
                Note /20
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {sortedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={criteriaColumns.length + 4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Aucun élève ne correspond aux critères actuels.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedStudents.map((student) => {
                const copy = evaluation.copies.find(c => c.studentId === student.id);
                const hasGrade = copy && copy.grade !== null;
                
                return (
                  <TableRow 
                    key={student.id}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { 
                        backgroundColor: (theme: Theme) => theme.palette.action.hover 
                      },
                      opacity: hasGrade ? 1 : 0.6
                    }}
                  >
                    {/* Nom et prénom */}
                    <TableCell 
                      component="th" 
                      scope="row"
                      sx={{ 
                        position: 'sticky', 
                        left: 0, 
                        backgroundColor: (theme: Theme) => 
                          theme.palette.mode === 'light' 
                            ? (theme.palette.action.hover)
                            : theme.palette.background.default
                      }}
                    >
                      {student.lastName}
                    </TableCell>
                    
                    <TableCell
                      sx={{ 
                        position: 'sticky', 
                        left: 120, 
                        backgroundColor: (theme: Theme) => 
                          theme.palette.mode === 'light' 
                            ? (theme.palette.action.hover)
                            : theme.palette.background.default
                      }}
                    >
                      {student.firstName}
                    </TableCell>
                    
                    {/* Points par critère */}
                    {criteriaColumns.map((column) => {
                      const points = hasGrade 
                        ? getStudentCriterionPoints(student.id, column.id) 
                        : null;
                      
                      // Calculer un pourcentage pour la couleur (rouge à vert)
                      const percentage = points !== null 
                        ? Math.min(100, Math.max(0, (points / column.maxPoints) * 100)) 
                        : 0;
                      
                      // Générer une couleur basée sur le pourcentage
                      const getColor = (percent: number) => {
                        if (percent >= 80) return '#4caf50'; // Vert
                        if (percent >= 60) return '#8bc34a'; // Vert-jaune
                        if (percent >= 40) return '#ffc107'; // Jaune
                        if (percent >= 20) return '#ff9800'; // Orange
                        return '#f44336'; // Rouge
                      };
                      
                      return (
                        <TableCell 
                          key={column.id} 
                          align="center"
                          sx={{ 
                            backgroundColor: hasGrade && points !== null 
                              ? `${getColor(percentage)}22` // Couleur avec opacité faible
                              : 'transparent'
                          }}
                        >
                          {hasGrade ? (
                            <Chip
                              label={`${points}/${column.maxPoints}`}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                minWidth: 50,
                                bgcolor: 'background.paper',
                                borderColor: getColor(percentage)
                              }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                    
                    {/* Total des points */}
                    <TableCell 
                      align="center"
                      sx={{ 
                        position: 'sticky', 
                        right: 80, 
                        backgroundColor: (theme: Theme) => 
                          theme.palette.mode === 'light' 
                            ? (theme.palette.action.hover)
                            : theme.palette.background.default,
                        fontWeight: 'bold'
                      }}
                    >
                      {hasGrade ? (
                        <Chip
                          label={`${copy?.grade}/${evaluation.maxPoints}`}
                          size="small"
                          color="primary"
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Non noté
                        </Typography>
                      )}
                    </TableCell>
                    
                    {/* Note sur 20 */}
                    <TableCell 
                      align="center"
                      sx={{ 
                        position: 'sticky', 
                        right: 0, 
                        backgroundColor: (theme: Theme) => 
                          theme.palette.mode === 'light' 
                            ? (theme.palette.action.hover)
                            : theme.palette.background.default,
                        fontWeight: 'bold'
                      }}
                    >
                      {hasGrade ? (
                        <Typography variant="body2" fontWeight="bold">
                          {((copy?.grade || 0) / evaluation.maxPoints * 20).toFixed(2)}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {sortedStudents.length} élève{sortedStudents.length > 1 ? 's' : ''} affiché{sortedStudents.length > 1 ? 's' : ''}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {evaluation.copies.filter(c => c.grade !== null).length} copie{evaluation.copies.filter(c => c.grade !== null).length > 1 ? 's' : ''} notée{evaluation.copies.filter(c => c.grade !== null).length > 1 ? 's' : ''}
          sur {students.length} élève{students.length > 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default EvaluationDetailedGrid;