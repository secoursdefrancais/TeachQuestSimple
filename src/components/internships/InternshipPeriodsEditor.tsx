// src/components/internships/InternshipPeriodsEditor.tsx

import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Switch,
    FormControlLabel,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { format, parseISO } from 'date-fns';

import { InternshipPeriod } from '../../services/schedule.service';
import { scheduleService } from '../../services/schedule.service';
import { studentService } from '../../services/student.service';

const InternshipPeriodsEditor: React.FC = () => {
    const [periods, setPeriods] = useState<InternshipPeriod[]>([]);
    const [groups, setGroups] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentPeriod, setCurrentPeriod] = useState<InternshipPeriod>({
        group: '',
        startDate: '',
        endDate: '',
        visitRequired: true,
        visitScheduled: false,
        reportDeadline: ''
    });

    useEffect(() => {
        // Charger les périodes de stage
        const loadedPeriods = scheduleService.getInternshipPeriods();
        setPeriods(loadedPeriods);

        // Charger les groupes disponibles
        const studentGroups = studentService.getAllStudentGroups();
        setGroups(studentGroups.map(g => g.group));
    }, []);

    const handleOpenDialog = (period?: InternshipPeriod) => {
        if (period) {
            setCurrentPeriod(period);
            setEditMode(true);
        } else {
            setCurrentPeriod({
                group: '',
                startDate: format(new Date(), 'yyyy-MM-dd'),
                endDate: format(new Date(), 'yyyy-MM-dd'),
                visitRequired: true,
                visitScheduled: false,
                reportDeadline: format(new Date(), 'yyyy-MM-dd')
            });
            setEditMode(false);
        }
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setCurrentPeriod(prev => ({
            ...prev,
            [name as string]: value
        }));
    };

    const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setCurrentPeriod(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSave = () => {
        if (editMode) {
            // Mise à jour d'une période existante
            const updatedPeriods = periods.map(p =>
                p.group === currentPeriod.group &&
                    p.startDate === currentPeriod.startDate ?
                    currentPeriod : p
            );
            setPeriods(updatedPeriods);
            scheduleService.saveInternshipPeriods(updatedPeriods);
        } else {
            // Création d'une nouvelle période
            const newPeriods = [...periods, currentPeriod];
            setPeriods(newPeriods);
            scheduleService.saveInternshipPeriods(newPeriods);
        }

        handleCloseDialog();
    };

    const handleDelete = (period: InternshipPeriod) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer la période de stage pour ${period.group} ?`)) {
            const updatedPeriods = periods.filter(p =>
                !(p.group === period.group && p.startDate === period.startDate)
            );
            setPeriods(updatedPeriods);
            scheduleService.saveInternshipPeriods(updatedPeriods);
        }
    };

    return (
        <Card>
            <CardHeader
                title="Périodes de stage"
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Ajouter une période
                    </Button>
                }
            />
            <CardContent>
                {periods.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        Aucune période de stage définie.
                    </Typography>
                ) : (
                    <Box sx={{ mt: 2 }}>
                        {periods.map((period, index) => (
                            <Card key={`${period.group}-${period.startDate}`} sx={{ mb: 2, bgcolor: 'background.paper' }}>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={3}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {period.group}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={5}>
                                            <Typography variant="body2">
                                                Du {format(parseISO(period.startDate), 'dd/MM/yyyy')}
                                                au {format(parseISO(period.endDate), 'dd/MM/yyyy')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Rapport à rendre pour le {format(parseISO(period.reportDeadline), 'dd/MM/yyyy')}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography variant="body2">
                                                {period.visitRequired ? 'Visite requise' : 'Pas de visite'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2} sx={{ textAlign: 'right' }}>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(period)}
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleDelete(period)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </CardContent>

            {/* Dialogue d'ajout/édition */}
            <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editMode ? 'Modifier une période de stage' : 'Ajouter une période de stage'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="group-label">Groupe</InputLabel>
                                <Select
                                    labelId="group-label"
                                    name="group"
                                    value={currentPeriod.group}
                                    onChange={handleChange}
                                    label="Groupe"
                                >
                                    {groups.map(group => (
                                        <MenuItem key={group} value={group}>
                                            {group}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="startDate"
                                label="Date de début"
                                type="date"
                                value={currentPeriod.startDate}
                                onChange={handleChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="endDate"
                                label="Date de fin"
                                type="date"
                                value={currentPeriod.endDate}
                                onChange={handleChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="reportDeadline"
                                label="Date limite de rendu du rapport"
                                type="date"
                                value={currentPeriod.reportDeadline}
                                onChange={handleChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={currentPeriod.visitRequired}
                                        onChange={handleBooleanChange}
                                        name="visitRequired"
                                    />
                                }
                                label="Visite requise"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={currentPeriod.visitScheduled}
                                        onChange={handleBooleanChange}
                                        name="visitScheduled"
                                        disabled={!currentPeriod.visitRequired}
                                    />
                                }
                                label="Visites planifiées"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Annuler</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Enregistrer
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default InternshipPeriodsEditor;