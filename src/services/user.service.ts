// src/services/user.service.ts

import { storageService } from './storage.service';
import { User } from '../types';

class UserService {
  // Méthode pour recharger les données
  public reloadData(): void {
    // Pas besoin de faire quoi que ce soit de spécial car toutes les méthodes
    // vont directement chercher les données dans le storageService
  }

  // Récupérer le profil utilisateur
  getUserProfile(): User | null {
    return storageService.getUserProfile();
  }
  
  // Sauvegarder le profil utilisateur
  saveUserProfile(user: User): boolean {
    return storageService.saveUserProfile(user);
  }
  
  // Ajouter des points XP
  addXP(points: number): User | null {
    const user = this.getUserProfile();
    
    if (!user) {
      console.error("Profil utilisateur non trouvé");
      return null;
    }
    
    // Ajouter les points
    const newXP = user.xp + points;
    
    // Vérifier si passage de niveau
    let newLevel = user.level;
    let newXpForNextLevel = user.xpForNextLevel;
    
    if (newXP >= user.xpForNextLevel) {
      newLevel += 1;
      newXpForNextLevel = this.calculateXpForNextLevel(newLevel);
    }
    
    // Mettre à jour les statistiques
    const updatedStats = {
      ...user.stats,
      totalXpEarned: user.stats.totalXpEarned + points
    };
    
    // Mettre à jour l'utilisateur
    const updatedUser: User = {
      ...user,
      xp: newXP,
      level: newLevel,
      xpForNextLevel: newXpForNextLevel,
      stats: updatedStats
    };
    
    // Sauvegarder les modifications
    this.saveUserProfile(updatedUser);
    
    return updatedUser;
  }
  
  // Calculer les XP nécessaires pour le niveau suivant
  calculateXpForNextLevel(level: number): number {
    // Formule: 100 * niveau + 50 * (niveau - 1)^2
    return 100 * level + 50 * Math.pow(level - 1, 2);
  }
  
  // Compléter une tâche et ajouter les XP correspondants
  completeTask(taskId: string, earnedXP: number): User | null {
    // Mettre à jour les statistiques de tâches
    const user = this.getUserProfile();
    
    if (!user) {
      console.error("Profil utilisateur non trouvé");
      return null;
    }
    
    // Mettre à jour le nombre de tâches complétées
    const updatedStats = {
      ...user.stats,
      tasksCompleted: user.stats.tasksCompleted + 1
    };
    
    // Mettre à jour l'utilisateur
    const updatedUser: User = {
      ...user,
      stats: updatedStats
    };
    
    // Sauvegarder les modifications
    this.saveUserProfile(updatedUser);
    
    // Ajouter les XP
    return this.addXP(earnedXP);
  }
  
  // Obtenir l'état actuel de progression
  getProgressionStatus(): {
    level: number;
    currentXP: number;
    xpForNextLevel: number;
    progress: number;
    badges: string[];
  } {
    const user = this.getUserProfile();
    
    if (!user) {
      return {
        level: 1,
        currentXP: 0,
        xpForNextLevel: 100,
        progress: 0,
        badges: []
      };
    }
    
    const progress = (user.xp / user.xpForNextLevel) * 100;
    
    return {
      level: user.level,
      currentXP: user.xp,
      xpForNextLevel: user.xpForNextLevel,
      progress,
      badges: user.badges
    };
  }
}

export const userService = new UserService();
export default userService;