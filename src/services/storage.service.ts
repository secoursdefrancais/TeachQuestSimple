// src/services/storage.service.ts

import { User, Task, TaskCategory, Rubric } from '../types';
import { StudentGroup, StudentInternship, Evaluation } from '../types';

// Clés pour localStorage uniformisées
const STORAGE_KEYS = {
    APPLICATION_DATA: 'teachquest_data', // Une seule clé pour toutes les données
    INITIALIZED: 'teachquest_initialized'
};

class StorageService {
    private applicationData: any = null;

    constructor() {
        this.loadData();
    }

    private loadData(): void {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.APPLICATION_DATA);
            this.applicationData = data ? JSON.parse(data) : null;
        } catch (error) {
            console.error("Erreur lors du chargement des données:", error);
            this.applicationData = null;
        }
    }

    private saveData(): boolean {
        try {
            localStorage.setItem(STORAGE_KEYS.APPLICATION_DATA, JSON.stringify(this.applicationData));
            return true;
        } catch (error) {
            console.error("Erreur lors de la sauvegarde des données:", error);
            return false;
        }
    }

    isInitialized(): boolean {
        return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
    }

    // Initialisation unifiée
    initializeStorage(data: any): boolean {
        if (this.isInitialized()) {
            return true;
        }

        try {
            // Copier toutes les données
            this.applicationData = {...data};
            
            // Ajouter un utilisateur
            this.applicationData.user = {
                id: 'current',
                name: 'Enseignant',
                level: 1,
                xp: 0,
                xpForNextLevel: 200,
                badges: [],
                stats: {
                    tasksCompleted: 0,
                    totalXpEarned: 0,
                    streakDays: 0,
                    categoryBreakdown: {}
                },
                preferences: {
                    theme: 'light',
                    notificationsEnabled: true,
                    defaultCorrectionTime: 10
                }
            };
            
            // Ajouter un tableau vide pour les tâches
            this.applicationData.tasks = [];
            
            // Sauvegarder les données
            const success = this.saveData();
            
            if (success) {
                localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
            }
            
            return success;
        } catch (error) {
            console.error("Erreur lors de l'initialisation:", error);
            return false;
        }
    }

    // Méthodes d'accès uniformes pour tous les types de données
    getData(dataType: string): any {
        if (!this.applicationData) {
            this.loadData();
        }
        
        return this.applicationData ? this.applicationData[dataType] : null;
    }

    setData(dataType: string, data: any): boolean {
        if (!this.applicationData) {
            this.loadData();
        }
        
        if (this.applicationData) {
            this.applicationData[dataType] = data;
            return this.saveData();
        }
        
        return false;
    }

    // Méthodes spécifiques pour la compatibilité avec le code existant
    getUserProfile(): User | null {
        return this.getData('user');
    }

    saveUserProfile(user: User): boolean {
        return this.setData('user', user);
    }

    getCollection<T>(collectionType: string): T[] {
        const collection = this.getData(collectionType);
        return Array.isArray(collection) ? collection : [];
    }

    setCollection<T>(collectionType: string, collection: T[]): boolean {
        return this.setData(collectionType, collection);
    }

    getAllTaskCategories(): TaskCategory[] {
        return this.getCollection<TaskCategory>('taskCategories');
    }

    getRubricById(id: string): Rubric | undefined {
        const rubrics = this.getCollection<Rubric>('rubrics');
        return rubrics.find(rubric => rubric.id === id);
    }

    saveRubric(rubric: Rubric): boolean {
        const rubrics = this.getCollection<Rubric>('rubrics');
        const index = rubrics.findIndex(r => r.id === rubric.id);

        if (index !== -1) {
            rubrics[index] = rubric;
        } else {
            rubrics.push(rubric);
        }

        return this.setCollection('rubrics', rubrics);
    }

    // Réinitialiser l'application
    resetApplication(): void {
        localStorage.removeItem(STORAGE_KEYS.APPLICATION_DATA);
        localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
        this.applicationData = null;
    }
}

export const storageService = new StorageService();