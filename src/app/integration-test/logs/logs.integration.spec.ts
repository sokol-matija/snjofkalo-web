import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component } from '@angular/core';
import { AdminLogsComponent } from '../../features/admin/admin-logs/admin-logs.component';
import { AdminService } from '../../core/services/admin.service';
import { of, throwError } from 'rxjs';
import { Log } from '../../core/models/user.model';
import { By } from '@angular/platform-browser';

@Component({
  selector: 'app-logs',
  template: '<router-outlet></router-outlet>'
})
class LogsWorkflowComponent {}

describe('Logs workflow Integration Tests', () => {
  let component: LogsWorkflowComponent;
  let fixture: ComponentFixture<LogsWorkflowComponent>;
  let router: Router;
  let location: Location;
  let mockAdminService: jasmine.SpyObj<AdminService>;

  const mockLogs: Log[] = [
    {
      idLog: 1,
      userId: 1,
      action: 'LOGIN',
      details: 'User logged in',
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      level: 'INFO',
      message: 'User login successful'
    },
    {
      idLog: 2,
      userId: 2,
      action: 'ERROR',
      details: 'Failed to process request',
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      level: 'ERROR',
      message: 'Request processing failed',
      exception: 'Invalid input'
    }
  ];

  beforeEach(async () => {
    mockAdminService = jasmine.createSpyObj('AdminService', ['getRecentLogs']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'admin/logs', component: AdminLogsComponent }
        ]),
        MatSnackBarModule,
        MatDialogModule,
        NoopAnimationsModule,
        AdminLogsComponent
      ],
      declarations: [LogsWorkflowComponent],
      providers: [
        { provide: AdminService, useValue: mockAdminService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);

    fixture = TestBed.createComponent(LogsWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to logs page and display logs', fakeAsync(() => {
    mockAdminService.getRecentLogs.and.returnValue(of(mockLogs));
    
    router.navigate(['/admin/logs']);
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/admin/logs');
    
    const logsComponent = fixture.debugElement.query(By.directive(AdminLogsComponent));
    expect(logsComponent).toBeTruthy();

    const logItems = fixture.debugElement.queryAll(By.css('.log-item'));
    expect(logItems.length).toBe(2);

    // Verify log content
    const firstLog = logItems[0];
    expect(firstLog.query(By.css('p:nth-child(1)')).nativeElement.textContent)
      .toContain('Timestamp:');
    expect(firstLog.query(By.css('p:nth-child(2)')).nativeElement.textContent)
      .toContain('Level:INFO');
    expect(firstLog.query(By.css('p:nth-child(3)')).nativeElement.textContent)
      .toContain('Message: User login successful');
  }));

  it('should handle error when fetching logs', fakeAsync(() => {
    const errorMessage = 'Failed to fetch logs';
    mockAdminService.getRecentLogs.and.returnValue(throwError(() => new Error(errorMessage)));
    
    router.navigate(['/admin/logs']);
    tick();
    fixture.detectChanges();

    const logsComponent = fixture.debugElement.query(By.directive(AdminLogsComponent));
    expect(logsComponent).toBeTruthy();
    expect(logsComponent.componentInstance.errorMessage).toBe(errorMessage);
  }));

  it('should display empty state when no logs are available', fakeAsync(() => {
    mockAdminService.getRecentLogs.and.returnValue(of([]));
    
    router.navigate(['/admin/logs']);
    tick();
    fixture.detectChanges();

    const noLogsMessage = fixture.debugElement.query(By.css('div:not(.log-list)'));
    expect(noLogsMessage.nativeElement.textContent).toContain('No logs found');
  }));

  it('should display logs with different levels and styles', fakeAsync(() => {
    mockAdminService.getRecentLogs.and.returnValue(of(mockLogs));
    
    router.navigate(['/admin/logs']);
    tick();
    fixture.detectChanges();

    const logItems = fixture.debugElement.queryAll(By.css('.log-item'));
    
    // Check INFO level
    const infoLevel = logItems[0].query(By.css('span'));
    expect(infoLevel.nativeElement.textContent.trim()).toBe('INFO');
    expect(infoLevel.nativeElement.classList.contains('log-error')).toBeFalse();
    expect(infoLevel.nativeElement.classList.contains('log-warn')).toBeFalse();

    // Check ERROR level
    const errorLevel = logItems[1].query(By.css('span'));
    expect(errorLevel.nativeElement.textContent.trim()).toBe('ERROR');
    expect(errorLevel.nativeElement.classList.contains('log-error')).toBeTrue();
  }));

  it('should display exception details when available', fakeAsync(() => {
    mockAdminService.getRecentLogs.and.returnValue(of(mockLogs));
    
    router.navigate(['/admin/logs']);
    tick();
    fixture.detectChanges();

    const logItems = fixture.debugElement.queryAll(By.css('.log-item'));
    const errorLog = logItems[1];
    
    expect(errorLog.query(By.css('p:nth-child(4)')).nativeElement.textContent)
      .toContain('Exception: Invalid input');
  }));
}); 