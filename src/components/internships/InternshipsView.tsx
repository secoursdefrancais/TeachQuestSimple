// src/components/internships/InternshipsView.tsx

import React from 'react';
import { Box, Typography, Grid, Paper, Tabs, Tab } from '@mui/material';
import InternshipPeriodsEditor from './InternshipPeriodsEditor';
import StudentInternshipList from './StudentInternshipList';

const InternshipsView: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des stages
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Périodes de stage" />
          <Tab label="Stages des élèves" />
        </Tabs>
      </Paper>
      
      {tabValue === 0 && (
        <InternshipPeriodsEditor />
      )}
      
      {tabValue === 1 && (
        <StudentInternshipList />
      )}
    </Box>
  );
};

export default InternshipsView;