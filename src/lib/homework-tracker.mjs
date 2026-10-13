// Only explicit individual evidence counts; a missing record never means absent.
export function homeworkState(student) {
  if (!student) return 'unknown';
  if (student.attendance === 'absent') return 'absent';
  const text=(student.en||'').normalize('NFKC');
  if (/homework requirement did not apply|excused from the previous homework/i.test(text)) return 'excused';
  if (/completion (?:was not confirmed|remains unconfirmed)|whether .*completed the homework remains unconfirmed|completion was not confirmed/i.test(text)) return 'unknown';
  // Later preparation corrections take precedence over an initial refusal.
  if (/Preparation update:.*had memorized|second attempt.*(?:memorized|present it all)/is.test(text)) return 'submitted';
  if (/(?:had not|has not|did not|didn't) completed? (?:his |her |the |their )?homework|had not done (?:his |her |the )?homework/i.test(text)) return 'missing';
  if (/appeared to have completed/i.test(text)) return 'unknown';
  if (/completed and submitted|completed (?:his |her |the |their |previous )?homework|fulfilled the homework requirements|remembered her homework and was able to present it all|Activity:[^\n]*Homework speech|Activity:[^\n]*homework presentation/i.test(text)) return 'submitted';
  return 'unknown';
}
export function trackerGroups(data,today,selected='all') {
  return data.classes.filter(g=>selected==='all'||g.id===selected).map(group=>{
    const sessions=group.sessions.filter(s=>s.date<=today).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    const roster=new Map();
    sessions.forEach(s=>s.students.forEach(p=>roster.set(p.id,p.name)));
    const rows=[...roster].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,name])=>{
      const cells=sessions.map(s=>({session:s,state:s.status==='cancelled'?'cancelled':homeworkState(s.students.find(p=>p.id===id)),student:s.students.find(p=>p.id===id)}));
      const days=state=>new Set(cells.filter(c=>c.state===state).map(c=>c.session.date)).size;
      return {id,name,cells,submitted:days('submitted'),missing:days('missing'),absent:days('absent'),unknown:days('unknown')};
    });
    return {group,sessions,rows};
  }).filter(g=>g.sessions.length);
}
export function renderHomeworkTracker(root,data,today,selected,language='en') {
  const zh=language==='zh', labels=zh?{submitted:'✓ 已交 / 已展示',missing:'✗ 未完成',absent:'缺席',unknown:'? 未确认',excused:'免交',cancelled:'取消'}:{submitted:'✓ Submitted / presented',missing:'✗ Not completed',absent:'Absent',unknown:'? Unknown',excused:'Excused',cancelled:'Cancelled'};
  const node=(tag,text='')=>{const n=document.createElement(tag);n.textContent=text;return n;};
  root.replaceChildren();
  root.append(node('h2',zh?'作业与出勤累计记录':'Running homework & attendance tracker'),node('p',zh?'全部历史，按班级分组。日期是检查作业的课堂日期。未知不计为未完成或缺席；免交及取消不计入总数。点击状态查看原始反馈。':'All history, grouped by class. Dates are the classes where homework was checked. Unknown does not count as missing or absent; excused and cancelled are excluded. Click a status to see its feedback.'));
  const exportButton=node('button',zh?'导出 Excel CSV':'Export Excel CSV');exportButton.type='button';root.append(exportButton);
  const groups=trackerGroups(data,today,selected),csv=[['Class','Student','Submitted days','Not completed days','Absent days','Unknown days','Class date','Time','Status']];
  for(const {group,sessions,rows} of groups){
    const section=node('section'),heading=node('h3',group.label[language]);section.append(heading);
    const scroll=node('div');scroll.className='tracker-scroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',group.label[language]);
    const table=node('table'),caption=node('caption',group.label[language]);table.append(caption);const head=node('thead'),hr=node('tr');
    [zh?'学生':'Student',zh?'已交天数':'Submitted days',zh?'未完成天数':'Not completed days',zh?'缺席天数':'Absent days',zh?'未确认天数':'Unknown days',...sessions.map(s=>s.date+' · '+s.time)].forEach(t=>{const th=node('th',t);th.scope='col';hr.append(th);});head.append(hr);table.append(head);
    const body=node('tbody');
    for(const row of rows){const tr=node('tr'),name=node('th',row.name);name.scope='row';tr.append(name);[row.submitted,row.missing,row.absent,row.unknown].forEach(n=>tr.append(node('td',String(n))));
      for(const cell of row.cells){const td=node('td');td.className='tracker-'+cell.state;
        const label=labels[cell.state];if(cell.student){const a=node('a',label);a.href=`/fb/?class=${encodeURIComponent(group.id)}&date=${cell.session.date}&student=${encodeURIComponent(row.id)}`;a.title=cell.student[language]||label;td.append(a);}else td.textContent=label;
        tr.append(td);csv.push([group.label[language],row.name,row.submitted,row.missing,row.absent,row.unknown,cell.session.date,cell.session.time,label]);
      }body.append(tr);
    }table.append(body);scroll.append(table);section.append(scroll);root.append(section);
  }
  if(!groups.length)root.append(node('p',zh?'暂无历史记录。':'No history recorded yet.'));
  exportButton.onclick=()=>{const safe=v=>{const t=String(v);return '"'+(/^[=+@\-\t\r]/.test(t)?"'"+t:t).replaceAll('"','""')+'"';};const blob=new Blob(['\uFEFF'+csv.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='speakkai-homework-'+today+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
