interface Edit {
  id: string;
  label: string;
  invalid: boolean;
}
const editContext = Symbol("sal-edits");
class EditState {
  entries = $state<Record<string, Edit>>({});
  get pending(): Edit[] {
    return Object.values(this.entries);
  }
  update(id: string, label: string, dirty: boolean, invalid: boolean): void {
    if (dirty || invalid) {
      this.entries = { ...this.entries, [id]: { id, label, invalid } };
    } else {
      this.remove(id);
    }
  }
  remove(id: string): void {
    this.entries = Object.fromEntries(Object.entries(this.entries).filter(([key]) => key !== id));
  }
}

export { EditState, editContext };
