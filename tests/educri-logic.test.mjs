import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidE164Phone,
  hasMinimumAge,
  filterAndPaginate,
  calculateAttendanceRate,
  getAllowedSectionsByRole
} from './educri-logic.mjs';

test('valida telefono en formato E.164', () => {
  assert.equal(isValidE164Phone('+34600111222'), true);
  assert.equal(isValidE164Phone('600111222'), false);
  assert.equal(isValidE164Phone('+012345678'), false);
});

test('valida edad minima de 18', () => {
  assert.equal(hasMinimumAge('2000-01-01', 18), true);
  assert.equal(hasMinimumAge('2010-01-01', 18), false);
});

test('filtra y pagina lista', () => {
  const items = [{ name: 'Ana' }, { name: 'Carlos' }, { name: 'Carla' }];
  const result = filterAndPaginate(items, 'car', (item, q) => item.name.toLowerCase().includes(q), 1, 1);
  assert.equal(result.filtered.length, 2);
  assert.equal(result.pageItems.length, 1);
  assert.equal(result.totalPages, 2);
});

test('calcula porcentaje de asistencia', () => {
  const pct = calculateAttendanceRate(['present', 'present', 'absent', 'late']);
  assert.equal(pct, 50);
});

test('secciones permitidas por rol', () => {
  assert.equal(getAllowedSectionsByRole('profesor').includes('moderador'), false);
  assert.equal(getAllowedSectionsByRole('moderador').includes('moderador'), true);
});

