import React from 'react';
import { List, Datagrid, TextField, Edit, SimpleForm, TextInput, Create, SelectInput, DeleteButton } from 'react-admin';

const severityChoices = [
    { id: 'info', name: 'Info' },
    { id: 'warning', name: 'Warning' },
    { id: 'critical', name: 'Critical' },
];

export const SquawkList = () => (
    <List>
        <Datagrid rowClick="edit">
            <TextField source="code" label="Squawk Code" />
            <TextField source="description" />
            <TextField source="message" label="Alert Message" />
            <TextField source="severity" />
            <TextField source="color" />
            <DeleteButton />
        </Datagrid>
    </List>
);

export const SquawkEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="code" disabled />
            <TextInput source="description" fullWidth />
            <TextInput source="message" fullWidth helperText="Message shown to users (e.g. EMERGENCY)" />
            <SelectInput source="severity" choices={severityChoices} />
            <TextInput source="color" helperText="Hex Code (e.g. #ff0000)" />
        </SimpleForm>
    </Edit>
);

export const SquawkCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="code" />
            <TextInput source="description" fullWidth />
            <TextInput source="message" fullWidth />
            <SelectInput source="severity" choices={severityChoices} defaultValue="warning" />
            <TextInput source="color" defaultValue="#ff0000" />
        </SimpleForm>
    </Create>
);
