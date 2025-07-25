import { Component, OnInit } from '@angular/core';
import { CommonModule, PRECONNECT_CHECK_BLOCKLIST } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, iif, Observable, switchMap } from 'rxjs';
interface Task {
  id: number;
  task: string;
  description: string;
  date: string;
  priority: string;
  done?: boolean;
}

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrl: './task.component.css',
})
export class TaskComponent implements OnInit {
  DefaultPriority = 'Normal';
  priorityOptions = ['High', 'Normal', 'Low'];
  inputTaskValue: string = '';
  desValue: string = '';
  dateValue: string = new Date().toISOString().split('T')[0];

  priorityValue: string = '';

  editedTaskName: string = '';
  search: string = '';

  tasks$ = new BehaviorSubject<Task[]>([]);
  currenttask$ = new BehaviorSubject<Task[]>([]);
  selectedTask$ = new BehaviorSubject<Task | null>(null);
  message$ = new BehaviorSubject<string>('');
  updateMessage$ = new BehaviorSubject<string>('');
  openedItemId$ = new BehaviorSubject<string | null>(null);
  checked$ = new BehaviorSubject<number[]>([]);
  condition$ = new BehaviorSubject<boolean>(true);

  List$: Observable<Task[]> = this.condition$.pipe(
    switchMap((condition) =>
      iif(() => condition, this.tasks$, this.currenttask$)
    )
  );

  constructor() {
    this.loadStorage();
  }

  ngOnInit(): void {
    const sortedTasks = this.sortTasksByDate(this.tasks$.value);
    this.tasks$.next(sortedTasks);
  }

  private updateTasks(updated: Task[]) {
    this.tasks$.next(updated);
    localStorage.setItem('tasks', JSON.stringify(updated));
  }

  get displayedTasks$() {
    return this.condition$.value ? this.tasks$ : this.currenttask$;
  }

  get displayedTasksValue() {
    return this.condition$.value ? this.tasks$.value : this.currenttask$.value;
  }

  generateRandomId() {
    return Math.floor(Math.random() * 1000000);
  }

  addTask() {
    if (!this.inputTaskValue) {
      this.message$.next('Please fill in all fields');
      return;
    }
    const today = new Date();
    const selectedDate = new Date(this.dateValue);

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    if (selectedDateStr < today.toISOString().split('T')[0]) {
      this.message$.next('Date cannot be in the past');
      return;
    }

    const newTask: Task = {
      id: this.generateRandomId(),
      task: this.inputTaskValue,
      description: this.desValue,
      date: this.dateValue,
      priority: this.priorityValue || this.DefaultPriority,
    };

    const updatedTasks = [...this.tasks$.value, newTask];
    const sorted = this.sortTasksByDate(updatedTasks);
    this.tasks$.next(sorted);
    this.resetTask();
  }

  private sortTasksByDate(tasks: Task[]): Task[] {
    return [...tasks].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  openDetail(index: number) {
    const selectedTask = this.displayedTasksValue[index];
    const selectedId = selectedTask.id.toString();

    if (this.openedItemId$.value === selectedId) {
      this.openedItemId$.next(null);
      this.selectedTask$.next(null);
    } else {
      this.openedItemId$.next(selectedId);
      this.selectedTask$.next(selectedTask);

      this.editedTaskName = selectedTask.task;
    }
  }

  saveTask() {
    const selectedTask = this.selectedTask$.value;
    if (!selectedTask) return;

    if (!this.editedTaskName.trim()) {
      this.updateMessage$.next('Please fill name of task');
      return;
    }

    const updatedTask = {
      ...selectedTask,
      task: this.editedTaskName,
    };

    const updatedTasks = this.tasks$.value.map((task) =>
      task.id === selectedTask.id ? updatedTask : task
    );

    this.updateTasks(updatedTasks);
    this.updateMessage$.next('Update successful');
    setTimeout(() => this.updateMessage$.next(''), 1000);
  }

  removeTask(id: number) {
    const updatedTasks = this.tasks$.value.filter((task) => task.id !== id);
    this.tasks$.next(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    this.checked$.next(this.checked$.value.filter((i) => i !== id));

    if (this.search.trim()) {
      const query = this.search.trim().toLowerCase();
      const found = updatedTasks.filter((tasks) =>
        tasks.task.toLowerCase().includes(query)
      );
      this.currenttask$.next(found);


       this.filterCheckedByVisible(found)
    }
    
  }

  resetTask() {
    this.inputTaskValue = '';
    this.desValue = '';
    this.dateValue = new Date().toISOString().split('T')[0];
    this.priorityValue = '';
    this.DefaultPriority = 'Normal';
    this.message$.next('');
    this.openedItemId$.next(null);
  }
  isChecked(id: number): boolean {
    console.log(this.checked$.value);
    return this.checked$.value.includes(id);
  }
  toggleCheck(id: number) {
    const current = this.checked$.value;

     const aftercheck = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
        
    this.checked$.next(aftercheck)


  }
  private filterCheckedByVisible(found: Task[]): void {
  const visibleIds = found.map((task) => task.id);
  const checkedIds = this.checked$.value;
  const filteredChecked = checkedIds.filter((id) => visibleIds.includes(id));
  this.checked$.next(filteredChecked);
}

  doneBtn() {
    const checked = this.checked$.value;
    const updated = this.tasks$.value.map((task) =>
      checked.includes(task.id) ? { ...task, done: true } : task
    );
    this.updateTasks(updated);
  }
  remove() {
    const checkedIds = this.checked$.value;
    const updatedTasks = this.tasks$.value.filter(
      (task) => !checkedIds.includes(task.id)
    );
    this.tasks$.next(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    this.checked$.next([]);

    if (this.search.trim()) {
      const query = this.search.trim().toLowerCase();
      const found = updatedTasks.filter((task) =>
        task.task.toLowerCase().includes(query)
      );
      this.currenttask$.next(found);
          this.filterCheckedByVisible(found)

    }



  }

  get currentList() {
    return this.condition$.value ? this.tasks$ : this.currenttask$;
  }

  loadStorage() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
      this.tasks$.next(JSON.parse(stored));
    }
  }

  searchChanged(event: any) {
    this.search = event.target.value;
    this.searchTask();
  }

  searchTask() {
    const query = this.search.trim().toLowerCase();

    if (!query) {
      this.condition$.next(true);
      this.currenttask$.next([]);

      return;
    }

    const found = this.tasks$.value.filter((item) =>
      item.task.toLowerCase().includes(query)
    );

    this.condition$.next(false);
    this.currenttask$.next(found);

    this.filterCheckedByVisible(found);

  }
}

