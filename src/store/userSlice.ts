import { createSlice } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
}

const initialState: User = {
  id: 0,
  name: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.id = action.payload.id;
      state.name = action.payload.name;
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;