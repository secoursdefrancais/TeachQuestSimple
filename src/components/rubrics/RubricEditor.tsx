// src/components/rubrics/RubricEditor.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    IconButton,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Tooltip,
    FormHelperText,
    Slider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { v4 as uuidv4 } from 'uuid';

import { Rubric, RubricCriterion, RubricSubCriterion } from '../../types';
import { studentService } from '../../services/student.service';

interface RubricEditorProps {
    initialRubric: Rubric | null;
    onSave: (rubric: Rubric) => void;
    onCancel: () => void;
}

// Types d'évaluation disponibles
const EVALUATION_TYPES = [
    { id: 'dissertation', name: 'Dissertation' },
    { id: 'commentaire', name: 'Commentaire de texte' },
    { id: 'analyse', name: 'Analyse littéraire' },
    { id: 'controle', name: 'Contrôle de connaissances' },
    { id: 'examen', name: 'Examen final' },
    { id: 'oral', name: 'Oral/Exposé' },
    { id: 'autre', name: 'Autre' }
];

const RubricEditor: React.FC<RubricEditorProps> = ({ initialRubric, onSave, onCancel }) => {
    // États pour le formulaire
    const [rubric, setRubric] = useState<Rubric>({
        id: '',
        name: '',
        evaluationType: 'dissertation',
        totalPoints: 20,
        passingThreshold: 10,
        creationDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        relatedClasses: [],
        criteria: []
    });

    const [expandedPanel, setExpandedPanel] = useState<string | false>('panel0');
    const [availableGroups, setAvailableGroups] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Initialiser le formulaire
    useEffect(() => {
        if (initialRubric) {
            setRubric(initialRubric);
        } else {
            // Ajouter un critère par défaut pour un nouveau barème
            setRubric(prev => ({
                ...prev,
                id: uuidv4(),
                criteria: [
                    {
                        id: uuidv4(),
                        name: 'Critère 1',
                        points: 5,
                        description: ''
                    }
                ]
            }));
        }

        // Charger les groupes disponibles
        try {
            const groups = studentService.getAllStudentGroups();
            setAvailableGroups(groups.map(group => group.group));
        } catch (error) {
            console.error("Erreur lors du chargement des groupes:", error);
        }
    }, [initialRubric]);

    // Mettre à jour un champ du barème
    const handleRubricChange = (field: keyof Rubric, value: any) => {
        setRubric(prev => ({
            ...prev,
            [field]: value,
            lastModified: new Date().toISOString().split('T')[0]
        }));

        // Effacer l'erreur pour ce champ si elle existe
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Ajouter un critère
    const handleAddCriterion = () => {
        const newCriterion: RubricCriterion = {
            id: uuidv4(),
            name: `Critère ${rubric.criteria.length + 1}`,
            points: 5,
            description: ''
        };

        setRubric(prev => ({
            ...prev,
            criteria: [...prev.criteria, newCriterion],
            lastModified: new Date().toISOString().split('T')[0]
        }));

        // Ouvrir le panneau du nouveau critère
        setExpandedPanel(`panel${rubric.criteria.length}`);
    };

    // Supprimer un critère
    const handleDeleteCriterion = (criterionId: string) => {
        setRubric(prev => ({
            ...prev,
            criteria: prev.criteria.filter(c => c.id !== criterionId),
            lastModified: new Date().toISOString().split('T')[0]
        }));
    };

    // Mettre à jour un critère
    const handleCriterionChange = (criterionId: string, field: keyof RubricCriterion, value: any) => {
        setRubric(prev => ({
            ...prev,
            criteria: prev.criteria.map(c =>
                c.id === criterionId
                    ? { ...c, [field]: value }
                    : c
            ),
            lastModified: new Date().toISOString().split('T')[0]
        }));
    };

    // Ajouter un sous-critère
    const handleAddSubCriterion = (criterionId: string) => {
        const criterion = rubric.criteria.find(c => c.id === criterionId);
        if (!criterion) return;

        const newSubCriterion: RubricSubCriterion = {
            id: uuidv4(),
            name: `Sous-critère ${criterion.subCriteria?.length ? criterion.subCriteria.length + 1 : 1}`,
            points: Math.min(2, criterion.points / 2), // La moitié des points du critère parent, max 2
            description: ''
        };

        setRubric(prev => ({
            ...prev,
            criteria: prev.criteria.map(c =>
                c.id === criterionId
                    ? {
                        ...c,
                        subCriteria: [...(c.subCriteria || []), newSubCriterion]
                    }
                    : c
            ),
            lastModified: new Date().toISOString().split('T')[0]
        }));
    };

    // Supprimer un sous-critère
    const handleDeleteSubCriterion = (criterionId: string, subCriterionId: string) => {
        setRubric(prev => ({
            ...prev,
            criteria: prev.criteria.map(c =>
                c.id === criterionId
                    ? {
                        ...c,
                        subCriteria: c.subCriteria?.filter(sc => sc.id !== subCriterionId)
                    }
                    : c
            ),
            lastModified: new Date().toISOString().split('T')[0]
        }));
    };

    // Mettre à jour un sous-critère
    const handleSubCriterionChange = (
        criterionId: string,
        subCriterionId: string,
        field: keyof RubricSubCriterion,
        value: any
    ) => {
        setRubric(prev => ({
            ...prev,
            criteria: prev.criteria.map(c =>
                c.id === criterionId
                    ? {
                        ...c,
                        subCriteria: c.subCriteria?.map(sc =>
                            sc.id === subCriterionId
                                ? { ...sc, [field]: value }
                                : sc
                        )
                    }
                    : c
            ),
            lastModified: new Date().toISOString().split('T')[0]
        }));
    };

    // Calcul du total des points
    const calculateTotalPoints = () => {
        return rubric.criteria.reduce((total, criterion) => {
            if (criterion.subCriteria && criterion.subCriteria.length > 0) {
                // Si des sous-critères existent, on additionne leurs points
                return total + criterion.subCriteria.reduce((subTotal, subCriterion) =>
                    subTotal + subCriterion.points, 0);
            }
            // Sinon on prend les points du critère principal
            return total + criterion.points;
        }, 0);
    };

    // Mise à jour du total des points lors d'un changement
    useEffect(() => {
        const calculatedTotal = calculateTotalPoints();
        if (calculatedTotal !== rubric.totalPoints) {
            handleRubricChange('totalPoints', calculatedTotal);
        }
    }, [rubric.criteria]);

    // Validation et soumission du formulaire
    const handleSubmit = () => {
        const newErrors: { [key: string]: string } = {};

        // Vérifier les champs obligatoires
        if (!rubric.name.trim()) {
            newErrors.name = "Le nom du barème est obligatoire";
        }

        if (rubric.criteria.length === 0) {
            newErrors.criteria = "Au moins un critère est requis";
        }

        // Vérifier que les critères ont un nom
        rubric.criteria.forEach((criterion, index) => {
            if (!criterion.name.trim()) {
                newErrors[`criterion_${index}`] = "Le nom du critère est obligatoire";
            }

            // Vérifier les sous-critères
            criterion.subCriteria?.forEach((subCriterion, subIndex) => {
                if (!subCriterion.name.trim()) {
                    newErrors[`subcriterion_${index}_${subIndex}`] = "Le nom du sous-critère est obligatoire";
                }
            });
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Soumettre le barème
        onSave(rubric);
    };

    // Gestion de l'expansion des panneaux de critères
    const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedPanel(isExpanded ? panel : false);
    };

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Informations générales */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Informations générales
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Nom du barème"
                                    fullWidth
                                    required
                                    value={rubric.name}
                                    onChange={(e) => handleRubricChange('name', e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Type d'évaluation</InputLabel>
                                    <Select
                                        value={rubric.evaluationType}
                                        label="Type d'évaluation"
                                        onChange={(e) => handleRubricChange('evaluationType', e.target.value)}
                                    >
                                        {EVALUATION_TYPES.map(type => (
                                            <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Classes concernées</InputLabel>
                                    <Select
                                        multiple
                                        value={rubric.relatedClasses || []}
                                        label="Classes concernées"
                                        onChange={(e) => handleRubricChange('relatedClasses', e.target.value)}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {(selected as string[]).map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {availableGroups.map(group => (
                                            <MenuItem key={group} value={group}>{group}</MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText>Facultatif: Sélectionnez les classes qui utiliseront ce barème</FormHelperText>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                    <Typography sx={{ mr: 2 }}>
                                        Seuil de réussite: {rubric.passingThreshold}/{rubric.totalPoints} points
                                    </Typography>
                                    <Slider
                                        value={rubric.passingThreshold || 10}
                                        onChange={(e, value) => handleRubricChange('passingThreshold', value)}
                                        min={0}
                                        max={rubric.totalPoints}
                                        step={0.5}
                                        valueLabelDisplay="auto"
                                        sx={{ ml: 2, flex: 1 }}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Critères d'évaluation */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Critères d'évaluation
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleAddCriterion}
                            >
                                Ajouter un critère
                            </Button>
                        </Box>

                        {errors.criteria && (
                            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                {errors.criteria}
                            </Typography>
                        )}

                        {rubric.criteria.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                Aucun critère défini. Cliquez sur "Ajouter un critère" pour commencer.
                            </Typography>
                        ) : (
                            rubric.criteria.map((criterion, index) => (
                                <Accordion
                                    key={criterion.id}
                                    expanded={expandedPanel === `panel${index}`}
                                    onChange={handlePanelChange(`panel${index}`)}
                                    sx={{ mb: 2 }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        sx={{
                                            bgcolor: 'background.subtle',
                                            '&:hover': { bgcolor: 'background.more' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                            <DragIndicatorIcon sx={{ mr: 1, color: 'action.active' }} />
                                            <Typography sx={{ flex: 1 }}>
                                                {criterion.name || 'Nouveau critère'} ({criterion.points} pts)
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCriterion(criterion.id);
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Nom du critère"
                                                    fullWidth
                                                    required
                                                    value={criterion.name}
                                                    onChange={(e) => handleCriterionChange(criterion.id, 'name', e.target.value)}
                                                    error={!!errors[`criterion_${index}`]}
                                                    helperText={errors[`criterion_${index}`]}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Points"
                                                    type="number"
                                                    fullWidth
                                                    required
                                                    value={criterion.points}
                                                    onChange={(e) => handleCriterionChange(criterion.id, 'points', parseFloat(e.target.value))}
                                                    InputProps={{
                                                        inputProps: { min: 0, step: 0.5 }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    label="Description (facultative)"
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    value={criterion.description || ''}
                                                    onChange={(e) => handleCriterionChange(criterion.id, 'description', e.target.value)}
                                                />
                                            </Grid>

                                            {/* Section des sous-critères */}
                                            <Grid item xs={12}>
                                                <Divider sx={{ my: 2 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="subtitle1">
                                                        Sous-critères
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => handleAddSubCriterion(criterion.id)}
                                                    >
                                                        Ajouter un sous-critère
                                                    </Button>
                                                </Box>

                                                {!criterion.subCriteria || criterion.subCriteria.length === 0 ? (
                                                    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                                                        Aucun sous-critère. Ajoutez des sous-critères pour une évaluation plus détaillée.
                                                    </Typography>
                                                ) : (
                                                    <Box sx={{ pl: 2, borderLeft: '2px solid #eee' }}>
                                                        {criterion.subCriteria.map((subCriterion, subIndex) => (
                                                            <Grid container spacing={2} key={subCriterion.id} sx={{ mb: 2 }}>
                                                                <Grid item xs={12} md={5}>
                                                                    <TextField
                                                                        label="Nom du sous-critère"
                                                                        fullWidth
                                                                        required
                                                                        size="small"
                                                                        value={subCriterion.name}
                                                                        onChange={(e) => handleSubCriterionChange(
                                                                            criterion.id,
                                                                            subCriterion.id,
                                                                            'name',
                                                                            e.target.value
                                                                        )}
                                                                        error={!!errors[`subcriterion_${index}_${subIndex}`]}
                                                                        helperText={errors[`subcriterion_${index}_${subIndex}`]}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={8} md={5}>
                                                                    <TextField
                                                                        label="Points"
                                                                        type="number"
                                                                        fullWidth
                                                                        required
                                                                        size="small"
                                                                        value={subCriterion.points}
                                                                        onChange={(e) => handleSubCriterionChange(
                                                                            criterion.id,
                                                                            subCriterion.id,
                                                                            'points',
                                                                            parseFloat(e.target.value)
                                                                        )}
                                                                        InputProps={{
                                                                            inputProps: { min: 0, step: 0.5 }
                                                                        }}
                                                                    />
                                                                </Grid>
                                                                <Grid item xs={4} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <IconButton
                                                                        color="error"
                                                                        onClick={() => handleDeleteSubCriterion(criterion.id, subCriterion.id)}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Grid>
                                                            </Grid>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            ))
                        )}

                        {/* Récapitulatif des points */}
                        <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.paper' }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Récapitulatif
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2">
                                        Total des points: <strong>{rubric.totalPoints}</strong>
                                    </Typography>
                                    <Typography variant="body2">
                                        Nombre de critères: <strong>{rubric.criteria.length}</strong>
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2">
                                        Seuil de réussite: <strong>{rubric.passingThreshold} points</strong> (
                                        {rubric.totalPoints ? Math.round(((rubric.passingThreshold ?? 0) / rubric.totalPoints) * 100) : 0}%)
                                    </Typography>
                                    <Typography variant="body2">
                                        Dernière modification: <strong>{new Date(rubric.lastModified).toLocaleDateString()}</strong>
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Paper>
                </Grid>
            </Grid>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                <Button variant="outlined" onClick={onCancel}>
                    Annuler
                </Button>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Enregistrer le barème
                </Button>
            </Box>
        </Box>
    );
};

export default RubricEditor;
