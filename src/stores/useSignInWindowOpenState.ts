import { create } from "zustand"

type State = {
  isOpen: boolean
}

type Actions = {
  setIsOpen: (isOpen: boolean) => void
}

type Store = State & Actions

export const useSignInWindowOpenState = create<Store>()((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => {
    console.log("onOpenChange triggered with value:", isOpen);
    set({ isOpen })
  },
}))
