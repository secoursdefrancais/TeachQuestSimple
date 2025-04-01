// src/utils/evaluationExportUtils.ts

import { Evaluation, Student, Rubric, RubricCriterion } from '../types';
import { evaluationService } from '../services/evaluation.service';

/**
 * Génère un export CSV détaillé des résultats d'évaluation avec tous les critères du barème
 * @param evaluation L'évaluation à exporter
 * @param students Liste des étudiants concernés
 * @param includeEmptyRows Inclure ou non les élèves sans note
 * @returns Contenu CSV formaté
 */
export const generateDetailedEvaluationGrid = (
    evaluation: Evaluation,
    students: Student[],
    includeEmptyRows: boolean = false
): string => {
    // Récupérer le barème de l'évaluation
    const rubric = evaluationService.getRubricById(evaluation.rubricId);
    if (!rubric) {
        console.error("Barème non trouvé pour l'évaluation:", evaluation.id);
        return "Erreur: Barème introuvable";
    }

    // Créer les en-têtes de colonnes
    const headers = ['Nom', 'Prénom'];

    // Tableau pour stocker les identifiants des colonnes des critères (pour les utiliser dans les données)
    const criteriaColumnIds: string[] = [];

    // Ajouter les critères et sous-critères comme colonnes
    rubric.criteria.forEach(criterion => {
        if (criterion.subCriteria && criterion.subCriteria.length > 0) {
            // Si le critère a des sous-critères, ajouter une colonne pour chaque sous-critère
            criterion.subCriteria.forEach(subCriterion => {
                const columnId = `${criterion.id}_${subCriterion.id}`;
                criteriaColumnIds.push(columnId);
                headers.push(`${criterion.name} - ${subCriterion.name} (${subCriterion.points}pts)`);
            });
        } else {
            // Sinon, ajouter seulement le critère principal
            criteriaColumnIds.push(criterion.id);
            headers.push(`${criterion.name} (${criterion.points}pts)`);
        }
    });

    // Ajouter les colonnes de total et de commentaire
    headers.push('Total', 'Note /20', 'Commentaires');

    // Commencer le CSV avec les en-têtes
    let csv = headers.join(',') + '\n';

    // Récupérer tous les étudiants concernés
    const relevantStudents = students.filter(student => {
        // Si on inclut les lignes vides, prendre tous les étudiants
        if (includeEmptyRows) return true;

        // Sinon, prendre seulement ceux qui ont une note
        const copy = evaluation.copies.find(c => c.studentId === student.id);
        return copy && copy.grade !== null;
    });

    // Ajouter les données pour chaque étudiant
    relevantStudents.forEach(student => {
        const studentCopy = evaluation.copies.find(c => c.studentId === student.id);

        // Si l'étudiant n'a pas de copie et qu'on n'inclut pas les lignes vides, passer
        if (!studentCopy && !includeEmptyRows) return;

        // Échapper les noms et prénoms pour éviter les problèmes avec les virgules
        const escapeName = (name: string) => `"${name.replace(/"/g, '""')}"`;

        // Commencer la ligne avec le nom et prénom
        const row = [escapeName(student.lastName), escapeName(student.firstName)];

        // Ajouter les points pour chaque critère/sous-critère
        criteriaColumnIds.forEach(columnId => {
            if (!studentCopy || studentCopy.grade === null) {
                row.push(''); // Pas de note
                return;
            }

            // Déterminer s'il s'agit d'un critère principal ou d'un sous-critère
            const [criterionId, subCriterionId] = columnId.split('_');

            // Trouver le détail du critère dans la copie
            const criterionDetail = studentCopy.details?.find(d => d.id === criterionId);

            if (!criterionDetail) {
                row.push('0');
                return;
            }

            if (subCriterionId) {
                // C'est un sous-critère
                const subCriterionDetail = criterionDetail.subCriteria?.find(sc => sc.id === subCriterionId);
                row.push(subCriterionDetail ? subCriterionDetail.points.toString() : '0');
            } else {
                // C'est un critère principal sans sous-critères
                row.push(criterionDetail.points.toString());
            }
        });

        // Ajouter le total des points
        const total = studentCopy && studentCopy.grade !== null ? studentCopy.grade : '';
        row.push(total.toString());

        // Ajouter la note sur 20
        const gradeOn20 = studentCopy && studentCopy.grade !== null
            ? ((studentCopy.grade / evaluation.maxPoints) * 20).toFixed(2)
            : '';
        row.push(gradeOn20);

        // Ajouter les commentaires (échappés pour le CSV)
        const comments = studentCopy && studentCopy.comments
            ? `"${studentCopy.comments.replace(/"/g, '""').replace(/\n/g, ' ')}"`
            : '';
        row.push(comments);

        // Ajouter la ligne au CSV
        csv += row.join(',') + '\n';
    });

    return csv;
};

/**
 * Télécharge un fichier CSV contenant toutes les données de l'évaluation
 * @param evaluation L'évaluation à exporter
 * @param students Liste des étudiants
 * @param includeEmptyRows Inclure ou non les élèves sans note
 */
export const downloadDetailedEvaluationGrid = (
    evaluation: Evaluation,
    students: Student[],
    includeEmptyRows: boolean = false
): void => {
    try {
        // Générer le contenu CSV
        const csvContent = generateDetailedEvaluationGrid(
            evaluation,
            students,
            includeEmptyRows
        );

        // Créer un nom de fichier basé sur l'évaluation
        const fileName = `${evaluation.name.replace(/\s+/g, '_')}_grille_complete_${new Date().toISOString().split('T')[0]}.csv`;

        // Créer un Blob avec le contenu CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        // Créer un lien de téléchargement
        const link = document.createElement('a');

        // Gérer les différentes méthodes de téléchargement selon les navigateurs
        if ((navigator as any).msSaveBlob) {
            // Pour IE et Edge
            (navigator as any).msSaveBlob(blob, fileName);
        } else {
            // Pour les autres navigateurs
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("Erreur lors de l'export de la grille d'évaluation:", error);
        throw new Error("Impossible d'exporter la grille d'évaluation. Veuillez réessayer.");
    }
};