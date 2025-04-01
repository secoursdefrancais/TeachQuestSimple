// src/services/evaluation.service.ts

import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storage.service';
import { Evaluation, Rubric } from '../types';

interface GradeData {
  studentId: string;
  grade: number;
  comments: string;
  details: any[];
}

class EvaluationService {
  // Méthode pour recharger les données
  public reloadData(): void {
    // Pas besoin de faire quoi que ce soit de spécial car toutes les méthodes
    // vont directement chercher les données dans le storageService
  }

  // Récupérer toutes les évaluations
  getAllEvaluations(): Evaluation[] {
    return storageService.getCollection<Evaluation>('evaluations');
  }

  // Récupérer une évaluation par son ID
  getEvaluationById(id: string): Evaluation | null {
    const evaluations = this.getAllEvaluations();
    return evaluations.find(e => e.id === id) || null;
  }

  // Récupérer les évaluations pour un groupe
  getEvaluationsByGroup(group: string): Evaluation[] {
    const evaluations = this.getAllEvaluations();
    return evaluations.filter(e => e.group === group);
  }

  // Récupérer tous les barèmes
  getAllRubrics(): Rubric[] {
    return storageService.getCollection<Rubric>('rubrics');
  }

  // Récupérer un barème par son ID
  getRubricById(id: string): Rubric | null {
    const rubrics = this.getAllRubrics();
    return rubrics.find(r => r.id === id) || null;
  }

  // Créer une nouvelle évaluation
  createEvaluation(evaluationData: Partial<Evaluation>): Evaluation {
    const newEvaluation: Evaluation = {
      id: uuidv4(),
      name: evaluationData.name || 'Nouvelle évaluation',
      subject: evaluationData.subject || '',
      group: evaluationData.group || '',
      type: evaluationData.type || 'quiz',
      date: evaluationData.date || new Date().toISOString().split('T')[0],
      rubricId: evaluationData.rubricId || '',
      maxPoints: evaluationData.maxPoints || 20,
      coefficient: evaluationData.coefficient || 1,
      theme: evaluationData.theme || '',
      copies: evaluationData.copies || []
    };

    const evaluations = this.getAllEvaluations();
    evaluations.push(newEvaluation);

    storageService.setCollection('evaluations', evaluations);
    return newEvaluation;
  }

  // Modifier une évaluation
  updateEvaluation(evaluation: Evaluation): Evaluation {
    const evaluations = this.getAllEvaluations();
    const index = evaluations.findIndex(e => e.id === evaluation.id);

    if (index !== -1) {
      evaluations[index] = evaluation;
      storageService.setCollection('evaluations', evaluations);
    }

    return evaluation;
  }

  // Sauvegarder une note
  saveGrade(evaluationId: string, gradeData: GradeData): Evaluation {
    const evaluations = this.getAllEvaluations();
    const index = evaluations.findIndex(e => e.id === evaluationId);

    if (index === -1) {
      throw new Error('Évaluation non trouvée');
    }

    const evaluation = evaluations[index];

    // Trouver la copie correspondante
    const copyIndex = evaluation.copies.findIndex(c => c.studentId === gradeData.studentId);

    if (copyIndex !== -1) {
      // Mettre à jour la copie existante
      evaluation.copies[copyIndex] = {
        ...evaluation.copies[copyIndex],
        grade: gradeData.grade,
        comments: gradeData.comments,
        details: gradeData.details
      };
    } else {
      // Créer une nouvelle copie
      evaluation.copies.push({
        studentId: gradeData.studentId,
        grade: gradeData.grade,
        comments: gradeData.comments,
        details: gradeData.details
      });
    }

    // Mettre à jour l'évaluation
    evaluations[index] = evaluation;
    storageService.setCollection('evaluations', evaluations);

    return evaluation;
  }

  // Supprimer une évaluation
  deleteEvaluation(id: string): boolean {
    const evaluations = this.getAllEvaluations();
    const filteredEvaluations = evaluations.filter(e => e.id !== id);

    if (filteredEvaluations.length === evaluations.length) {
      return false; // Aucune évaluation n'a été supprimée
    }

    return storageService.setCollection('evaluations', filteredEvaluations);
  }

  // Générer des statistiques pour une évaluation
  getEvaluationStats(evaluationId: string): {
    average: number;
    median: number;
    min: number;
    max: number;
    completionRate: number;
  } {
    const evaluation = this.getEvaluationById(evaluationId);

    if (!evaluation) {
      throw new Error('Évaluation non trouvée');
    }

    const grades = evaluation.copies
      .filter(c => c.grade !== null)
      .map(c => c.grade!);

    if (grades.length === 0) {
      return {
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        completionRate: 0
      };
    }

    // Calculer la moyenne
    const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;

    // Trier les notes pour la médiane, min et max
    const sortedGrades = [...grades].sort((a, b) => a - b);

    // Calculer la médiane
    const median = sortedGrades.length % 2 === 0
      ? (sortedGrades[sortedGrades.length / 2 - 1] + sortedGrades[sortedGrades.length / 2]) / 2
      : sortedGrades[Math.floor(sortedGrades.length / 2)];

    // Taux de complétion
    const completionRate = (grades.length / evaluation.copies.length) * 100;

    return {
      average,
      median,
      min: sortedGrades[0],
      max: sortedGrades[sortedGrades.length - 1],
      completionRate
    };
  }

  // Créer un nouveau barème
  createRubric(rubricData: Partial<Rubric>): Rubric {
    const newRubric: Rubric = {
      id: uuidv4(),
      name: rubricData.name || 'Nouveau barème',
      evaluationType: rubricData.evaluationType || 'generic',
      totalPoints: rubricData.totalPoints || 20,
      passingThreshold: rubricData.passingThreshold || 10,
      creationDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      relatedClasses: rubricData.relatedClasses || [],
      criteria: rubricData.criteria || []
    };

    const rubrics = this.getAllRubrics();
    rubrics.push(newRubric);

    storageService.setCollection('rubrics', rubrics);
    return newRubric;
  }

  // Mettre à jour un barème
  updateRubric(rubric: Rubric): Rubric {
    const rubrics = this.getAllRubrics();
    const index = rubrics.findIndex(r => r.id === rubric.id);

    if (index !== -1) {
      rubrics[index] = {
        ...rubric,
        lastModified: new Date().toISOString().split('T')[0]
      };
      storageService.setCollection('rubrics', rubrics);
    }

    return rubric;
  }

  saveRubric(rubric: Rubric): Rubric {
    // Générer un ID si c'est un nouveau barème
    if (!rubric.id) {
      rubric.id = uuidv4();
      rubric.creationDate = new Date().toISOString().split('T')[0];
    }

    // Mettre à jour la date de dernière modification
    rubric.lastModified = new Date().toISOString().split('T')[0];

    const rubrics = this.getAllRubrics();
    const index = rubrics.findIndex(r => r.id === rubric.id);

    if (index !== -1) {
      rubrics[index] = rubric;
    } else {
      rubrics.push(rubric);
    }

    storageService.setCollection('rubrics', rubrics);
    return rubric;
  }

  deleteRubric(id: string): boolean {
    const rubrics = this.getAllRubrics();
    const filteredRubrics = rubrics.filter(r => r.id !== id);

    if (filteredRubrics.length === rubrics.length) {
      return false; // Aucun barème n'a été supprimé
    }

    return storageService.setCollection('rubrics', filteredRubrics);
  }
}

export const evaluationService = new EvaluationService();
export default evaluationService;