import React from 'react';
import { 
  List, Datagrid, TextField, ChipField, EditButton, DeleteButton,
  Edit, SimpleForm, TextInput, ArrayInput, SimpleFormIterator,
  Create, SelectInput
} from 'react-admin';

export const ScenarioList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="trigger" label="Tetikleyici Olay" />
      <TextField source="id" label="ID" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const ScenarioEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="trigger" label="Tetikleyici Olay (Örn: Take-off)" fullWidth />
      <TextInput source="id" disabled />
      
      <ArrayInput source="messages" label="Mesaj Varyasyonları">
        <SimpleFormIterator>
          <TextInput source="text" label="Mesaj Metni" fullWidth multiline />
          <SelectInput source="lang" label="Dil" choices={[
            { id: 'tr', name: 'Türkçe' },
            { id: 'en', name: 'English' },
          ]} />
        </SimpleFormIterator>
      </ArrayInput>

      <ArrayInput source="squawkRules" label="Squawk Kodları (Örn: 7700)">
        <SimpleFormIterator>
           <TextInput label="Code" />
        </SimpleFormIterator>
      </ArrayInput>

    </SimpleForm>
  </Edit>
);

export const ScenarioCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="id" label="Scenario ID (Unique)" />
      <TextInput source="trigger" label="Tetikleyici Olay (Örn: Take-off)" fullWidth />
      
      <ArrayInput source="messages" label="Mesaj Varyasyonları">
        <SimpleFormIterator>
          <TextInput source="text" label="Mesaj Metni" fullWidth multiline />
          <SelectInput source="lang" label="Dil" choices={[
            { id: 'tr', name: 'Türkçe' },
            { id: 'en', name: 'English' },
          ]} />
        </SimpleFormIterator>
      </ArrayInput>

      <ArrayInput source="squawkRules" label="Squawk Kodları">
        <SimpleFormIterator>
           <TextInput label="Code" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
);
