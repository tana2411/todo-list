import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, filter, iif, map, Observable, switchMap, toArray } from 'rxjs';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task.component.html',
  styleUrl: './task.component.css'
})
export class TaskComponent implements OnInit {
  DefaultPriority = 'Normal';
  priorityOptions = ['High', 'Normal', 'Low'];
   inputTaskValue: string = '';
    desValue: string = '';
  dateValue: string = new Date().toISOString().split('T')[0];
  priorityValue: string = '';

  search: string =''




  tasks$ = new BehaviorSubject<{ id: number, task: string, description: string, date: string, priority: string }[]>([]);
  
  selectedTask$ = new BehaviorSubject<any>(null);
  message$ = new BehaviorSubject<string>('');

updateMessage$ =new BehaviorSubject<string>('');
  openedItemId$ = new BehaviorSubject<string | null>(null);
checked$ = new BehaviorSubject<number[]>([]);

currenttask$= new BehaviorSubject<{ id: number, task: string, description: string, date: string, priority: string }[]>([]);
  condition$= new BehaviorSubject<boolean>(true)


  done$ =new BehaviorSubject<string>('')
List$: Observable<any[]> = this.condition$.pipe(
  switchMap(condition =>
    iif(
      () => condition,
      this.tasks$,
      this.currenttask$
    )
  )
);





constructor() {
    this.loadStorage()
  }
  ngOnInit(): void {
      console.log(this.tasks$.value);

      const sortedTasks=this.sortTasksByDate(this.tasks$.value)
      this.tasks$.next(sortedTasks)
console.log('after',this.tasks$.value);


const today=new Date()

const tasks= this.tasks$.value.map(task=>{
  const taskDate= new Date(task.date)
if(taskDate<today){

  return {...task,past:true}
   
}
else{
  return {...task,past:false}
}
})
this.tasks$.next(tasks)

  }

  generateRandomId() {
    return Math.floor(Math.random() * 1000000);
  }

  addTask() {
    if (!this.inputTaskValue) {
      this.message$.next('Please fill in all fields');
      return;
    }
    if(this.dateValue < new Date().toISOString().split('T')[0]) {

      this.message$.next('Date cannot be in the past');
      return;
    }
    const newTask = {
      id: this.generateRandomId(),
      task: this.inputTaskValue,
      description: this.desValue,
      date: this.dateValue,
      priority: this.priorityValue || this.DefaultPriority
    };

    const currentTasks = this.tasks$.value;
    const updatedTasks = [...currentTasks, newTask];
    const  sortedTasks = this.sortTasksByDate(updatedTasks)
    this.tasks$.next(sortedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    this.resetTask();
  }


  private sortTasksByDate(tasks: { id: number, task: string, description: string, date: string, priority: string }[]) 
  {  console.log(tasks)


  return [...tasks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

}

  openDetail(index: number) {
    
    const task = this.tasks$.value[index];
    const selectedId = task.id.toString();

    if (this.openedItemId$.value === selectedId) {
       
      this.openedItemId$.next(null);
         this.selectedTask$.next(null);
    } else {
      this.openedItemId$.next(selectedId);
        this.selectedTask$.next(task);
    }
  }

  saveTask() {
    const updatedTask = this.selectedTask$.value;
  
    const updatedTasks = this.tasks$.value.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    

    if (!updatedTask.task ) {
      this.updateMessage$.next('Please fill name of task');
      return;
    
    
    }

    if(updatedTask.date < new Date().toISOString().split('T')[0]) {
      this.updateMessage$.next('Date cannot be in the past');
      return;
    }




    this.tasks$.next(updatedTasks);

    this.updateMessage$.next('update correctly');
    setTimeout(() => {
    this.updateMessage$.next('');

    }, 1000);
    
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }

  removeTask(index: number) {
    const updatedTasks = [...this.tasks$.value];
    console.log('check',updatedTasks)

     updatedTasks.splice(index, 1);


     this.tasks$.next(updatedTasks);
     localStorage.setItem('tasks', JSON.stringify(updatedTasks));
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

toggleCheck(id:number) {

     const currentCheck = this.checked$.value;
     
    console.log(this.tasks$.value[id])

  if (currentCheck.includes(id)) {
    this.checked$.next(currentCheck.filter(item => item !== id))
  } else {
    this.checked$.next([...currentCheck, id]);


}




}
doneBtn() {
  const checkedIndexes = this.checked$.value;
  const currentTasks = this.tasks$.value;

  const doneTasks = currentTasks.map((task, index) => {
    if (checkedIndexes.includes(index)) {
      return { ...task, done: true }; 

    }
      console.log(task)

    return task;
  });

  this.tasks$.next(doneTasks);
  localStorage.setItem('tasks',JSON.stringify(doneTasks))
}

  


  remove(){


  const checkedIndex = this.checked$.value;

  const removeTask =this.tasks$.value.filter((task, index) =>
    
    
    !checkedIndex.includes(index));
  
  console.log(removeTask)

  this.tasks$.next(removeTask)


    localStorage.setItem('tasks', JSON.stringify(removeTask));


    this.checked$.next([]);
   // reset checked

// this.tasks$.value.forEach((task, index) => {
//   console.log(task)
//   console.log('Index:', index); // sẽ in ra 0, 1, 2, 3, 4
// });  


  }
get currentList() {
  return this.condition$ ? this.tasks$ : this.currenttask$;
}

  loadStorage()
{
  const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      this.tasks$.next(JSON.parse(storedTasks));
    }
}
  searchTask(){
    
  
const items= this.tasks$.value
const foundItem = items.filter(item => {
  return item.task.includes(this.search);
});

this.condition$.next(false)

this.currenttask$.next(foundItem)

console.log(this.currenttask$.value)
// this.tasks$.next(foundItem)


// if(!this.search ){
//     this.loadStorage()
    

// }
// else
// {
//   this.tasks$.next(foundItem)}






  }

}
