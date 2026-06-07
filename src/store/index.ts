import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useStore = () => {
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);
  return { dispatch, state };
};