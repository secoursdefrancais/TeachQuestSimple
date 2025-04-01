// src/components/tasks/TaskItem.tsx

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Checkbox,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Tooltip,
    Badge
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DoneIcon from '@mui/icons-material/Done';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Task } from '../../types';

interface TaskItemProps {
    task: Task;
    onEdit?: () => void;
    onDelete?: () => void;
    onStatusChange?: (newStatus: 'pending' | 'inProgress' | 'completed') => void;
    displayCategory?: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
    task, 
    onEdit, 
    onDelete, 
    onStatusChange,
    displayCategory 
}) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

    // Gestion du menu d'actions
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    // Gestion des actions
    const handleEdit = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onEdit) onEdit();
        handleMenuClose();
    };

    const handleDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (onDelete) onDelete();
        handleMenuClose();
    };

    const handleStatusChange = (newStatus: 'pending' | 'inProgress' | 'completed') => {
        if (onStatusChange) onStatusChange(newStatus);
        handleMenuClose();
    };

    // Obtenir une couleur basée sur la priorité
    const getPriorityColor = (priority: number): string => {
        const colors: Record<number, string> = {
            1: '#f44336', // Très haute
            2: '#ff9800', // Haute
            3: '#ffc107', // Moyenne
            4: '#4caf50', // Basse
            5: '#2196f3', // Très basse
        };

        return colors[priority] || colors[3];
    };

    // Obtenir le texte de la priorité
    const getPriorityText = (priority: number): string => {
        const texts: Record<number, string> = {
            1: 'Très haute',
            2: 'Haute',
            3: 'Moyenne',
            4: 'Basse',
            5: 'Très basse'
        };

        return texts[priority] || texts[3];
    };

    return (
        <Paper
            sx={{
                p: 1,
                display: 'flex',
                alignItems: 'center',
                bgcolor: task.status === 'completed' ? '#f5f5f5' : 'white',
                borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                '&:hover': {
                    bgcolor: task.status === 'completed' ? '#eeeeee' : '#f9f9f9'
                },
                position: 'relative'
            }}
            elevation={1}
        >
            <Checkbox
                checked={task.status === 'completed'}
                onChange={() => handleStatusChange(task.status === 'completed' ? 'pending' : 'completed')}
                sx={{ mr: 1 }}
            />

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography
                        variant="body1"
                        fontWeight="medium"
                        sx={{
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                            flexGrow: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {task.name}
                    </Typography>
                    
                    <Tooltip title={getPriorityText(task.priority)}>
                        <PriorityHighIcon 
                            fontSize="small" 
                            sx={{ 
                                color: getPriorityColor(task.priority), 
                                ml: 1,
                                opacity: 0.7
                            }} 
                        />
                    </Tooltip>
                </Box>

                {task.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mb: 0.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                        }}
                    >
                        {task.description}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {displayCategory && (
                        <Chip
                            label={displayCategory}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5 }}
                        />
                    )}
                    
                    {task.relatedGroups && task.relatedGroups.length > 0 && (
                        <Chip
                            label={task.relatedGroups.join(', ')}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5 }}
                        />
                    )}

                    {task.relatedSubject && (
                        <Chip
                            label={task.relatedSubject}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5 }}
                        />
                    )}

                    {(task.estimatedTime ?? 0) > 0 && (
                        <Tooltip title="Temps estimé">
                            <Chip
                                icon={<AccessTimeIcon fontSize="small" />}
                                label={`${task.estimatedTime} min`}
                                size="small"
                                variant="outlined"
                            />
                        </Tooltip>
                    )}

                    <Chip
                        label={`+${task.earnedXP} XP`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            </Box>

            <Box>
                <IconButton 
                    size="small" 
                    onClick={handleMenuOpen}
                    aria-label="Plus d'options"
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Menu d'actions */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    Modifier
                </MenuItem>
                
                {task.status !== 'inProgress' && (
                    <MenuItem onClick={() => handleStatusChange('inProgress')}>
                        <ListItemIcon>
                            <PlayArrowIcon fontSize="small" />
                        </ListItemIcon>
                        Marquer en cours
                    </MenuItem>
                )}
                
                {task.status === 'inProgress' && (
                    <MenuItem onClick={() => handleStatusChange('pending')}>
                        <ListItemIcon>
                            <PauseIcon fontSize="small" />
                        </ListItemIcon>
                        Mettre en pause
                    </MenuItem>
                )}
                
                {task.status !== 'completed' && (
                    <MenuItem onClick={() => handleStatusChange('completed')}>
                        <ListItemIcon>
                            <DoneIcon fontSize="small" />
                        </ListItemIcon>
                        Marquer terminée
                    </MenuItem>
                )}
                
                {task.status === 'completed' && (
                    <MenuItem onClick={() => handleStatusChange('pending')}>
                        <ListItemIcon>
                            <PlayArrowIcon fontSize="small" />
                        </ListItemIcon>
                        Recommencer
                    </MenuItem>
                )}
                
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Supprimer
                </MenuItem>
            </Menu>
        </Paper>
    );
};

export default TaskItem;