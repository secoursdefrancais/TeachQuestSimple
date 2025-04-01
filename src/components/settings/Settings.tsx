// src/components/settings/Settings.tsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Divider,
    Snackbar,
    Card,
    CardContent,
    CardHeader,
    List,
    ListItem,
    ListItemText,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import {
    CloudDownload as DownloadIcon,
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

import { storageService } from '../../services/storage.service';
import { scheduleService } from '../../services/schedule.service';
import { taskService } from '../../services/task.service';
import { evaluationService } from '../../services/evaluation.service';
import { studentService } from '../../services/student.service';
import { userService } from '../../services/user.service';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Settings: React.FC = () => {
    const [message, setMessage] = useState<{ text: string, severity: 'success' | 'error' | 'info' } | null>(null);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [importSuccessOpen, setImportSuccessOpen] = useState(false);
    const [exportSuccessOpen, setExportSuccessOpen] = useState(false);

    // Exporter toutes les données de l'application
    const handleExportData = () => {
        try {
            // Collecter toutes les données à exporter
            const exportData = {
                user: storageService.getData('user'),
                students: storageService.getData('students'),
                tasks: storageService.getData('tasks'),
                taskCategories: storageService.getData('taskCategories'),
                evaluations: storageService.getData('evaluations'),
                rubrics: storageService.getData('rubrics'),
                studentInternships: storageService.getData('studentInternships'),
                regularSchedule: storageService.getData('regularSchedule'),
                holidays: storageService.getData('holidays'),
                specialEvents: storageService.getData('specialEvents'),
                internshipPeriods: storageService.getData('internshipPeriods'),
                alternatingWeeks: storageService.getData('alternatingWeeks'),
                // Ajoutez d'autres données si nécessaire
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0' // Vous pouvez stocker une version pour gérer les migrations futures
            };

            // Convertir en chaîne JSON
            const jsonString = JSON.stringify(exportData, null, 2);

            // Créer un Blob pour le téléchargement
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Créer un lien de téléchargement
            const a = document.createElement('a');
            a.href = url;
            a.download = `teachquest_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();

            // Nettoyer
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setExportSuccessOpen(true);
        } catch (error) {
            console.error('Erreur lors de l\'exportation des données:', error);
            setMessage({ text: 'Erreur lors de l\'exportation des données', severity: 'error' });
        }
    };

    // Importer des données
    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedData = JSON.parse(content);

                // Vérification de base pour s'assurer que c'est un fichier valide
                if (!importedData || typeof importedData !== 'object') {
                    throw new Error('Format de fichier invalide');
                }

                // Importer chaque section de données
                Object.entries(importedData).forEach(([key, value]) => {
                    // Ignorer la date d'exportation et la version de l'app
                    if (key !== 'exportDate' && key !== 'appVersion') {
                        storageService.setData(key, value);
                    }
                });

                // Recharger tous les services
                scheduleService.reloadData();
                taskService.reloadData();
                studentService.reloadData();
                evaluationService.reloadData();
                userService.reloadData();

                setImportSuccessOpen(true);
            } catch (error) {
                console.error('Erreur lors de l\'importation des données:', error);
                setMessage({ text: 'Erreur lors de l\'importation des données: format invalide', severity: 'error' });
            }
        };

        reader.readAsText(file);

        // Réinitialiser le champ de fichier pour permettre une nouvelle importation du même fichier
        event.target.value = '';
    };

    // Réinitialiser toutes les données
    const handleResetData = () => {
        try {
            // Effacer toutes les données
            localStorage.clear();

            // Recharger la page pour réinitialiser l'application
            window.location.reload();
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            setMessage({ text: 'Erreur lors de la réinitialisation des données', severity: 'error' });
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Paramètres
            </Typography>

            <Grid container spacing={3}>
                {/* Gestion des données */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader title="Gestion des données" />
                        <CardContent>
                            <Grid container spacing={2} direction="column">
                                <Grid item>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleExportData}
                                        fullWidth
                                    >
                                        Exporter toutes les données
                                    </Button>
                                </Grid>

                                <Grid item>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadIcon />}
                                        fullWidth
                                    >
                                        Importer des données
                                        <input
                                            type="file"
                                            accept=".json"
                                            hidden
                                            onChange={handleImportData}
                                        />
                                    </Button>
                                </Grid>

                                <Grid item>
                                    <Divider sx={{ my: 2 }} />
                                </Grid>

                                <Grid item>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => setResetDialogOpen(true)}
                                        fullWidth
                                    >
                                        Réinitialiser toutes les données
                                    </Button>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Attention: Cette action effacera définitivement toutes vos données.
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Autres paramètres pourront être ajoutés ici */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader title="Préférences utilisateur" />
                        <CardContent>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Thème sombre"
                                        secondary="Changer l'apparence de l'application"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                // Vous pourriez connecter ceci à un état global de thème
                                                onChange={(e) => console.log('Theme toggle:', e.target.checked)}
                                            />
                                        }
                                        label=""
                                    />
                                </ListItem>

                                <ListItem>
                                    <ListItemText
                                        primary="Notifications"
                                        secondary="Activer les notifications pour les échéances"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                // Vous pourriez connecter ceci à un paramètre utilisateur
                                                onChange={(e) => console.log('Notifications toggle:', e.target.checked)}
                                            />
                                        }
                                        label=""
                                    />
                                </ListItem>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* À propos */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title="À propos de TeachQuest" />
                        <CardContent>
                            <Typography variant="body1" paragraph>
                                TeachQuest est une application conçue pour les enseignants afin de gérer leurs tâches, emplois du temps et évaluations.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Version: 1.0.0
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialogue de confirmation pour réinitialiser les données */}
            <Dialog
                open={resetDialogOpen}
                onClose={() => setResetDialogOpen(false)}
                aria-labelledby="reset-dialog-title"
                aria-describedby="reset-dialog-description"
            >
                <DialogTitle id="reset-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    Confirmer la réinitialisation
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="reset-dialog-description">
                        Vous êtes sur le point de supprimer toutes les données de l'application. Cette action est irréversible.
                        <br /><br />
                        Nous vous recommandons vivement d'exporter vos données avant de procéder à la réinitialisation.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetDialogOpen(false)} autoFocus>
                        Annuler
                    </Button>
                    <Button onClick={handleResetData} color="error" variant="contained">
                        Réinitialiser
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialogue de succès d'importation */}
            <Dialog
                open={importSuccessOpen}
                onClose={() => setImportSuccessOpen(false)}
                aria-labelledby="import-success-dialog-title"
            >
                <DialogTitle id="import-success-dialog-title">
                    Importation réussie
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Les données ont été importées avec succès. Vous pouvez maintenant utiliser ces données dans l'application.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportSuccessOpen(false)} autoFocus>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialogue de succès d'exportation */}
            <Dialog
                open={exportSuccessOpen}
                onClose={() => setExportSuccessOpen(false)}
                aria-labelledby="export-success-dialog-title"
            >
                <DialogTitle id="export-success-dialog-title">
                    Exportation réussie
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Les données ont été exportées avec succès. Vous pouvez maintenant utiliser ce fichier pour sauvegarder ou transférer vos données.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportSuccessOpen(false)} autoFocus>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification pour les erreurs */}
            {message && (
                <Snackbar
                    open={true}
                    autoHideDuration={6000}
                    onClose={() => setMessage(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setMessage(null)}
                        severity={message.severity}
                        sx={{ width: '100%' }}
                    >
                        {message.text}
                    </Alert>
                </Snackbar>
            )}
        </Box>
    );
};

export default Settings;