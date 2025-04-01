// src/components/correction/EvaluationResultsView.tsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BarChartIcon from '@mui/icons-material/BarChart';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import GridViewIcon from '@mui/icons-material/GridView';
import GridOnIcon from '@mui/icons-material/GridOn';
import TableChartIcon from '@mui/icons-material/TableChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { Evaluation, Student } from '../../types';
import { evaluationService } from '../../services/evaluation.service';
import { studentService } from '../../services/student.service';
import { evaluationToCSV, evaluationToDetailedCSV, downloadCSV } from '../../utils/exportUtils';
import { downloadDetailedEvaluationGrid } from '../../utils/evaluationExportUtils';
import EvaluationDetailedGrid from './EvaluationDetailedGrid';

interface EvaluationResultsViewProps {
  evaluationId: string;
  onClose: () => void;
}

const EvaluationResultsView: React.FC<EvaluationResultsViewProps> = ({ evaluationId, onClose }) => {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<{
    average: number;
    median: number;
    min: number;
    max: number;
    completionRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger l'évaluation
        const ev = evaluationService.getEvaluationById(evaluationId);
        if (!ev) {
          console.error("Évaluation non trouvée");
          return;
        }

        setEvaluation(ev);

        // Charger les élèves
        const studentsList = studentService.getStudentsByGroup(ev.group);
        setStudents(studentsList);

        // Calculer les statistiques
        const evalStats = evaluationService.getEvaluationStats(evaluationId);
        setStats(evalStats);
      } catch (error) {
        console.error("Erreur lors du chargement des résultats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evaluationId]);

  // Trouver un élève par son ID
  const findStudent = (studentId: string): Student | undefined => {
    return students.find(s => s.id === studentId);
  };

  // Gérer l'ouverture du menu d'exportation
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchorEl(event.currentTarget);
  };

  // Fermer le menu d'exportation
  const handleExportClose = () => {
    setExportMenuAnchorEl(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Exporter les résultats au format CSV
  const handleExportCSV = (detailed: boolean = false) => {
    if (!evaluation) return;

    try {
      setExportLoading(true);

      // Créer le contenu CSV
      const csvContent = detailed
        ? evaluationToDetailedCSV(evaluation, students)
        : evaluationToCSV(evaluation, students);

      // Nom du fichier
      const fileName = `${evaluation.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;

      // Télécharger le fichier
      downloadCSV(csvContent, fileName);

      setExportSuccess("Exportation réussie!");
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de l'exportation:", error);
      setExportError("Erreur lors de l'exportation. Veuillez réessayer.");
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setExportLoading(false);
      handleExportClose();
    }
  };

  // Exporter la grille détaillée
  const handleExportDetailedGrid = (includeAllStudents: boolean = false) => {
    if (!evaluation) return;

    try {
      setExportLoading(true);

      // Exporter la grille détaillée
      downloadDetailedEvaluationGrid(evaluation, students, includeAllStudents);

      setExportSuccess("Grille d'évaluation exportée avec succès!");
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de l'exportation de la grille:", error);
      setExportError("Erreur lors de l'exportation. Veuillez réessayer.");
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setExportLoading(false);
      handleExportClose();
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!evaluation || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Impossible de charger les données de l'évaluation.
        </Alert>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ mt: 2 }}
        >
          Retour à la liste
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}

      {exportSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setExportSuccess(null)}>
          {exportSuccess}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={onClose} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">
              Résultats : {evaluation.name}
            </Typography>
          </Box>

          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              sx={{ mr: 1 }}
              onClick={handleExportClick}
              disabled={exportLoading}
            >
              {exportLoading ? "Exportation..." : "Exporter"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Imprimer
            </Button>

            {/* Menu d'exportation */}
            <Menu
              anchorEl={exportMenuAnchorEl}
              open={Boolean(exportMenuAnchorEl)}
              onClose={handleExportClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleExportCSV(false)}>
                <ListItemIcon>
                  <TableChartIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Exporter CSV simple</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportCSV(true)}>
                <ListItemIcon>
                  <AssessmentIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Exporter CSV détaillé</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => handleExportDetailedGrid(false)}>
                <ListItemIcon>
                  <GridViewIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Exporter grille de barème (avec notes)</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleExportDetailedGrid(true)}>
                <ListItemIcon>
                  <GridOnIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Exporter grille complète (tous les élèves)</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={evaluation.subject} color="primary" size="small" />
              <Chip label={evaluation.group} color="secondary" size="small" />
              <Chip label={format(new Date(evaluation.date), 'dd MMMM yyyy', { locale: fr })} size="small" variant="outlined" />
              <Chip label={`Coefficient: ${evaluation.coefficient}`} size="small" variant="outlined" />
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                {evaluation.copies.length} copies corrigées • {stats.completionRate.toFixed(0)}% terminé
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Onglets */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Résumé des résultats" />
          <Tab label="Grille détaillée" />
        </Tabs>
      </Paper>

      {/* Contenu pour l'onglet Résumé */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Résultats par élève
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Élève</TableCell>
                      <TableCell align="right">Note</TableCell>
                      <TableCell align="right">Note /20</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evaluation.copies
                      .filter(copy => copy.grade !== null)
                      .sort((a, b) => {
                        // Trier par note décroissante
                        return (b.grade || 0) - (a.grade || 0);
                      })
                      .map(copy => {
                        const student = findStudent(copy.studentId);

                        if (!student) return null;

                        return (
                          <TableRow key={copy.studentId}>
                            <TableCell>
                              {student.lastName} {student.firstName}
                            </TableCell>
                            <TableCell align="right">
                              {copy.grade}/{evaluation.maxPoints}
                            </TableCell>
                            <TableCell align="right">
                              {((copy.grade || 0) / evaluation.maxPoints * 20).toFixed(1)}/20
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Statistiques
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Moyenne
                    </Typography>
                    <Typography variant="h5">
                      {stats.average.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /{evaluation.maxPoints}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Médiane
                    </Typography>
                    <Typography variant="h5">
                      {stats.median.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /{evaluation.maxPoints}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Min
                    </Typography>
                    <Typography variant="h5">
                      {stats.min.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /{evaluation.maxPoints}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Max
                    </Typography>
                    <Typography variant="h5">
                      {stats.max.toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      /{evaluation.maxPoints}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<BarChartIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Voir le détail des statistiques
                </Button>

                <Button
                  variant="contained"
                  startIcon={<PictureAsPdfIcon />}
                  fullWidth
                >
                  Générer les bulletins
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Contenu pour l'onglet Grille détaillée */}
      {activeTab === 1 && (
        <Paper sx={{ p: 2 }}>
          <EvaluationDetailedGrid
            evaluation={evaluation}
            students={students}
          />
        </Paper>
      )}
    </Box>
  );
};

export default EvaluationResultsView;