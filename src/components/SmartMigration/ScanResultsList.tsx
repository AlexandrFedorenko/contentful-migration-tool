import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
  Paper,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface ScanResultItem {
  id: string;
  title: string;
  status: 'changed' | 'new' | 'equal';
  sysStatus?: 'Draft' | 'Changed' | 'Published';
  sourceUpdatedAt?: string;
  targetUpdatedAt?: string;
  contentTypeId: string; // Added for filter
}

interface ScanResultsListProps {
  items: ScanResultItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onItemClick: (item: ScanResultItem) => void;
  height?: string | number;
}

const StatusChip = styled(Chip)<{ status: string }>(({ theme, status }) => ({
  fontWeight: 600,
  borderRadius: '6px',
  fontSize: '0.75rem',
  height: '24px',
  color: status === 'equal' ? theme.palette.text.secondary : '#fff',
  backgroundColor:
    status === 'new' ? theme.palette.success.main :
      status === 'changed' ? theme.palette.warning.main :
        theme.palette.action.selected,
  border: status === 'equal' ? `1px solid ${theme.palette.divider}` : 'none',
}));

export default function ScanResultsList({ items, selectedIds, onToggleSelect, onItemClick, height = 600 }: ScanResultsListProps) {
  return (
    <Paper variant="outlined" sx={{ height, overflow: 'auto', borderRadius: 2 }}>
      <List disablePadding>
        {items.map((item, index) => {
          const isSelected = selectedIds.indexOf(item.id) !== -1;
          const labelId = `checkbox-list-label-${item.id}`;

          return (
            <React.Fragment key={item.id}>
              <ListItem
                button
                onClick={() => onItemClick(item)}
                sx={{
                  py: 1.5,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {item.sysStatus && item.sysStatus !== 'Published' && (
                      <Chip
                        label={item.sysStatus.toUpperCase()}
                        size="small"
                        variant="outlined"
                        color={item.sysStatus === 'Changed' ? 'primary' : 'default'}
                        sx={{ height: 24, fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    )}
                    <StatusChip
                      label={item.status.toUpperCase()}
                      status={item.status}
                      size="small"
                    />
                  </Box>
                }
              >
                <ListItemIcon onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(item.id);
                }}>
                  <Checkbox
                    edge="start"
                    checked={isSelected}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                    color="primary"
                  />
                </ListItemIcon>
                <ListItemText
                  id={labelId}
                  primary={
                    <Typography variant="body1" fontWeight={500} sx={{ mb: 0.5 }}>
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      ID: {item.id}
                    </Typography>
                  }
                />
              </ListItem>
              {index < items.length - 1 && <Divider component="li" />}
            </React.Fragment>
          );
        })}
      </List>
    </Paper>
  );
}
