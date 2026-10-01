import { AbstractControl, ValidationErrors } from '@angular/forms';

export function uniqueTeamNameValidator(existingNames: string[]) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim().toLowerCase();
    if (!value) {
      return null;
    }

    const isDuplicate = existingNames.some((name) => name.trim().toLowerCase() === value);
    return isDuplicate ? { duplicateTeamName: true } : null;
  };
}
