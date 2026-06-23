import { TestBed } from '@angular/core/testing';
import { PtyTerminalComponent } from './pty-terminal.component';

describe('PtyTerminalComponent', () => {
  it('requires a sandbox session id input', () => {
    const fixture = TestBed.createComponent(PtyTerminalComponent);
    fixture.componentRef.setInput('sessionId', 'test-session');
    fixture.componentRef.setInput('labTitle', 'Filesystem Quest');

    expect(fixture.componentInstance.sessionId()).toBe('test-session');
    expect(fixture.componentInstance.labTitle()).toBe('Filesystem Quest');
  });
});
