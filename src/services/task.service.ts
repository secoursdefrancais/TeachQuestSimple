// src/services/task.service.ts

import { v4 as uuidv4 } from 'uuid';
import { Task, TaskCategory } from '../types';
import { format } from 'date-fns';
import { storageService } from './storage.service';

export class TaskService {
    // Méthode pour recharger les données
    public reloadData(): void {
        try {
            // Vérification simple en essayant d'accéder aux données
            const tasks = this.getAllTasks();
            const categories = this.getTaskCategories();
            
            // Si les tâches n'existent pas, créer un tableau vide
            if (!tasks || tasks.length === undefined) {
                storageService.setData('tasks', []);
            }
            
            // Si les catégories n'existent pas, essayer de les récupérer depuis le stockage global
            if (!categories || categories.length === 0) {
                const taskCategories = storageService.getData('taskCategories');
                if (taskCategories && taskCategories.length > 0) {
                    storageService.setData('taskCategories', taskCategories);
                }
            }
        } catch (error) {
            console.error("Erreur lors du rechargement des données de tâches:", error);
            
            // Réinitialiser les tâches en cas d'erreur critique
            try {
                storageService.setData('tasks', []);
            } catch {
                // Si même la réinitialisation échoue, il y a un problème critique avec le stockage
            }
        }
    }

    // Récupérer toutes les tâches
    getAllTasks(): Task[] {
        try {
            return storageService.getCollection<Task>('tasks');
        } catch (error) {
            console.error("Erreur lors de la récupération des tâches:", error);
            return [];
        }
    }
    
    // Récupérer une tâche par son ID
    getTaskById(id: string): Task | undefined {
        try {
            const tasks = this.getAllTasks();
            return tasks.find(task => task.id === id);
        } catch (error) {
            console.error(`Erreur lors de la récupération de la tâche ${id}:`, error);
            return undefined;
        }
    }
    
    // Récupérer les tâches à venir
    getUpcomingTasks(days: number = 7): Task[] {
        try {
            const tasks = this.getAllTasks();
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + days);
            
            return tasks.filter(task => {
                if (task.status === 'completed') {
                    return false;
                }
                
                const dueDate = new Date(task.dueDate);
                return dueDate >= today && dueDate <= futureDate;
            }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        } catch (error) {
            console.error("Erreur lors de la récupération des tâches à venir:", error);
            return [];
        }
    }
    
    // Récupérer les tâches pour une date spécifique
    getTasksForDate(date: Date): Task[] {
        try {
            const tasks = this.getAllTasks();
            const dateStr = format(date, 'yyyy-MM-dd');
            
            return tasks.filter(task => {
                return task.dueDate === dateStr;
            });
        } catch (error) {
            console.error(`Erreur lors de la récupération des tâches pour ${date}:`, error);
            return [];
        }
    }
    
    // Récupérer toutes les catégories de tâches
    getTaskCategories(): TaskCategory[] {
        try {
            return storageService.getCollection<TaskCategory>('taskCategories');
        } catch (error) {
            console.error("Erreur lors de la récupération des catégories:", error);
            return [];
        }
    }
    
    // Calculer les points XP pour une tâche selon la formule à 3 dimensions
    calculateTaskPoints(baseXP: number, estimeValue: number, plaisirValue: number): number {
        const settings = {
            baseXpMultiplier: 1.0,
            estimeMultiplier: 0.7,
            plaisirAdjustment: -0.3
        };
        
        // Points = XP * (1 + (Estime * estimeMultiplier/10) - (Plaisir * plaisirAdjustment/10))
        const points = baseXP * (
            1 + 
            (estimeValue * settings.estimeMultiplier / 10) - 
            (plaisirValue * settings.plaisirAdjustment / 10)
        );
        
        return Math.round(points);
    }
    
    // Créer une nouvelle tâche
    createTask(taskData: Partial<Task>): Task {
        try {
            const taskCategories = this.getTaskCategories();
            const taskCategory = taskCategories.find(cat => cat.id === taskData.categoryId);
            
            if (!taskCategory) {
                throw new Error('Catégorie de tâche non trouvée');
            }
            
            // Calculer les points XP
            const earnedXP = this.calculateTaskPoints(
                taskCategory.xpValue,
                taskCategory.estimeValue,
                taskCategory.plaisirValue
            );
            
            const newTask: Task = {
                id: uuidv4(),
                name: taskData.name || 'Nouvelle tâche',
                description: taskData.description || '',
                categoryId: taskData.categoryId || 0,
                status: 'pending',
                dueDate: taskData.dueDate || format(new Date(), 'yyyy-MM-dd'),
                relatedGroups: taskData.relatedGroups || [],
                relatedSubject: taskData.relatedSubject || '',
                priority: taskData.priority || 3,
                estimatedTime: taskData.estimatedTime || 0,
                earnedXP: earnedXP,
                notes: taskData.notes || ''
            };
            
            // Sauvegarder la tâche avec gestion d'erreur
            const tasks = this.getAllTasks();
            tasks.push(newTask);
            
            try {
                storageService.setCollection('tasks', tasks);
            } catch (error) {
                console.error("Erreur lors de la sauvegarde de la tâche:", error);
                
                // Tentative de récupération: sauvegarder uniquement la nouvelle tâche
                try {
                    storageService.setCollection('tasks', [newTask]);
                } catch {
                    throw new Error("Impossible de sauvegarder la tâche. Espace de stockage insuffisant.");
                }
            }
            
            return newTask;
        } catch (error) {
            console.error("Erreur lors de la création de la tâche:", error);
            throw error;
        }
    }
    
    // Mettre à jour une tâche existante
    updateTask(taskData: Task): Task {
        try {
            const tasks = this.getAllTasks();
            const index = tasks.findIndex(task => task.id === taskData.id);
            
            if (index === -1) {
                throw new Error('Tâche non trouvée');
            }
            
            tasks[index] = taskData;
            
            try {
                storageService.setCollection('tasks', tasks);
            } catch (error) {
                console.error("Erreur lors de la mise à jour des tâches:", error);
                throw new Error("Impossible de sauvegarder les modifications. Espace de stockage insuffisant.");
            }
            
            return taskData;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la tâche:", error);
            throw error;
        }
    }
    
    // Compléter une tâche
    completeTask(taskId: string): Task {
        try {
            const task = this.getTaskById(taskId);
            
            if (!task) {
                throw new Error('Tâche non trouvée');
            }
            
            const updatedTask: Task = {
                ...task,
                status: 'completed',
                completionDate: format(new Date(), 'yyyy-MM-dd')
            };
            
            return this.updateTask(updatedTask);
        } catch (error) {
            console.error("Erreur lors de la complétion de la tâche:", error);
            throw error;
        }
    }
    
    // Supprimer une tâche
    deleteTask(taskId: string): void {
        try {
            const tasks = this.getAllTasks();
            const filteredTasks = tasks.filter(task => task.id !== taskId);
            storageService.setCollection('tasks', filteredTasks);
        } catch (error) {
            console.error("Erreur lors de la suppression de la tâche:", error);
            throw error;
        }
    }
    
    // Sauvegarder toutes les tâches
    saveAllTasks(tasks: Task[]): boolean {
        try {
            return storageService.setCollection('tasks', tasks);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de toutes les tâches:", error);
            return false;
        }
    }
}

export const taskService = new TaskService();