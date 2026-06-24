import { permissionsFromStatMode } from './live-state';

describe('permissionsFromStatMode', () => {
  it('strips the file type prefix from stat -c %A output', () => {
    expect(permissionsFromStatMode('-rw-r--r--')).toBe('rw-r--r--');
    expect(permissionsFromStatMode('-rwxr-xr-x')).toBe('rwxr-xr-x');
  });
});
