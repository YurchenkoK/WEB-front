import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DrugsFilterState {
  name: string;
}

const initialState: DrugsFilterState = {
  name: "",
};

const filterSlice = createSlice({
  name: "drugsFilter",
  initialState,
  reducers: {
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    clearFilter: (state) => {
      state.name = "";
    },
  },
});

export const { setName, clearFilter } = filterSlice.actions;
export default filterSlice.reducer;
