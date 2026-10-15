const $ = (id) => document.getElementById(id);
const today = new Date();
const dateISO = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmt = (n) => 'Rs ' + Math.round(Number(n)||0).toLocaleString('en-PK');
const safeText = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const incomeCategories = ['Sales','Services','Project payment','Other income'];
const expenseCategories = ['Supplies','Rent & utilities','Marketing','Transport','Salary / wages','Software','Other expense'];
const categoryColors = ['#8b7cff','#49c5a2','#ffae72','#4c91db','#d58adf','#e6cf6b','#6e9aab'];
const monthName = (d) => d.toLocaleDateString('en-US',{month:'short'});
const sampleDate = (offset, day=12) => { const d=new Date(today.getFullYear(),today.getMonth()+offset,Math.min(day,28)); return dateISO(d); };
const starter = [
 {id:1,type:'income',description:'Website project payment',amount:18500,date:sampleDate(0,4),category:'Services',person:'Ahmed Traders',notes:'Business website milestone'},
 {id:2,type:'expense',description:'Social media campaign',amount:4200,date:sampleDate(0,5),category:'Marketing',person:'Ad platform',notes:'Campaign spend'},
 {id:3,type:'income',description:'Product sales',amount:8500,date:sampleDate(0,7),category:'Sales',person:'Walk-in customers',notes:''},
 {id:4,type:'expense',description:'Office supplies',amount:1850,date:sampleDate(0,8),category:'Supplies',person:'City Stationers',notes:''},
 {id:5,type:'income',description:'Landing page project',amount:12000,date:sampleDate(0,10),category:'Project payment',person:'Horizon Properties',notes:'Landing page delivery'},
 {id:6,type:'expense',description:'Internet and utilities',amount:2600,date:sampleDate(0,11),category:'Rent & utilities',person:'Utility provider',notes:''},
 {id:7,type:'expense',description:'Local transport',amount:950,date:sampleDate(0,13),category:'Transport',person:'Travel',notes:''},
 {id:8,type:'income',description:'Monthly maintenance',amount:6000,date:sampleDate(-1,18),category:'Services',person:'Ahmed Traders',notes:'Website maintenance'},
 {id:9,type:'expense',description:'Design software',amount:1800,date:sampleDate(-1,20),category:'Software',person:'Software vendor',notes:''},
 {id:10,type:'income',description:'Store sales',amount:14300,date:sampleDate(-1,22),category:'Sales',person:'Walk-in customers',notes:''},
 {id:11,type:'expense',description:'Packaging material',amount:3200,date:sampleDate(-2,14),category:'Supplies',person:'Packaging shop',notes:''},
 {id:12,type:'income',description:'Consultation fee',amount:5000,date:sampleDate(-2,16),category:'Services',person:'New customer',notes:''}
];
let transactions = loadData();
let activeView = 'overview';
let activeFilter = 'all';
let currentType = 'income';
let toastTimer;
function loadData(){
  try { const stored=localStorage.getItem('nexoraBizTransactions'); if(stored!==null){const parsed=JSON.parse(stored); if(Array.isArray(parsed))return parsed;} } catch(e){}
  return starter;
}
function persist(){ try{localStorage.setItem('nexoraBizTransactions',JSON.stringify(transactions));}catch(e){showToast('Browser storage is unavailable. Export your data as backup.');} }
function dateLabel(iso){ if(!iso)return '—'; const d=new Date(iso+'T12:00:00'); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
function getPeriodItems(){
  const period=$('periodSelect').value;
  return transactions.filter(t=>{
    if(period==='all')return true;
    const d=new Date((t.date||dateISO(today))+'T12:00:00');
    if(period==='today')return t.date===dateISO(today);
    return d.getFullYear()===today.getFullYear()&&d.getMonth()===today.getMonth();
  });
}
function totals(items){const income=items.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);const expense=items.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);return {income,expense,profit:income-expense};}
function renderStats(){
  const items=getPeriodItems(), t=totals(items), incomeCount=items.filter(x=>x.type==='income').length, expenseCount=items.filter(x=>x.type==='expense').length;
  $('incomeTotal').textContent=fmt(t.income);$('expenseTotal').textContent=fmt(t.expense);$('profitTotal').textContent=(t.profit<0?'−':'')+fmt(Math.abs(t.profit));
  $('transactionCount').textContent=items.length.toLocaleString('en-PK');$('incomeCount').textContent=incomeCount+' income';$('expenseCount').textContent=expenseCount+' expenses';
  const margin=t.income?Math.round(t.profit/t.income*100):0;$('marginFoot').textContent=t.income?`Net margin ${margin}%`:'Income minus expenses';
  $('profitTrack').style.width=(t.income?Math.min(100,Math.max(0,t.profit/t.income*100)):0)+'%';
  $('incomeFoot').textContent=$('periodSelect').value==='today'?'Today’s recorded income':$('periodSelect').value==='all'?'All recorded income':'This month’s recorded income';
  $('chartIncome').textContent=fmt(t.income);$('chartExpense').textContent=fmt(t.expense);
  $('donutTotal').textContent=fmt(t.expense);
}
function renderChart(){
  const bars=$('chartColumns');bars.innerHTML='';
  const months=[];
  for(let i=5;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth()-i,1);months.push({year:d.getFullYear(),month:d.getMonth(),label:monthName(d)});}
  const monthTotals=months.map(m=>{const items=transactions.filter(t=>{const d=new Date((t.date||dateISO(today))+'T12:00:00');return d.getMonth()===m.month&&d.getFullYear()===m.year;});return {...m,...totals(items)};});
  const max=Math.max(20000,...monthTotals.flatMap(m=>[m.income,m.expense]))*1.05;
  monthTotals.forEach(m=>{
    const col=document.createElement('div');col.className='month-column';
    const income=document.createElement('div');income.className='bar income';income.style.height=Math.max(2,m.income/max*100)+'%';income.title='Income: '+fmt(m.income);
    const expense=document.createElement('div');expense.className='bar expense';expense.style.height=Math.max(2,m.expense/max*100)+'%';expense.title='Expenses: '+fmt(m.expense);
    const label=document.createElement('label');label.textContent=m.label;
    col.append(income,expense,label);bars.append(col);
  });
}
function renderBreakdown(){
  const items=getPeriodItems().filter(t=>t.type==='expense'), grouped={};
  items.forEach(t=>grouped[t.category]=(grouped[t.category]||0)+Number(t.amount));
  const entries=Object.entries(grouped).sort((a,b)=>b[1]-a[1]).slice(0,5), total=entries.reduce((s,e)=>s+e[1],0);
  const donut=$('donut');
  if(!entries.length){donut.style.background='#30364a';$('categoryList').innerHTML='<div class="category-row"><span>No expenses in this period</span><b>—</b></div>';return;}
  let degree=0;const stops=[];
  entries.forEach(([cat,val],i)=>{const next=degree+(val/total*360);stops.push(`${categoryColors[i%categoryColors.length]} ${degree}deg ${next}deg`);degree=next;});
  donut.style.background=`conic-gradient(${stops.join(',')})`;
  $('categoryList').innerHTML=entries.map(([cat,val],i)=>`<div class="category-row"><i style="background:${categoryColors[i%categoryColors.length]}"></i><span>${safeText(cat)}</span><b>${fmt(val)}</b></div>`).join('');
}
function visibleTransactions(){
  const q=$('searchInput').value.trim().toLowerCase();
  return getPeriodItems().filter(t=>(activeFilter==='all'||t.type===activeFilter)&&(!q||[t.description,t.category,t.person,t.notes,t.date].join(' ').toLowerCase().includes(q))).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||b.id-a.id);
}
function renderTransactions(){
  const items=visibleTransactions();$('transactionRows').innerHTML='';
  items.slice(0,100).forEach(t=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><div class="desc-cell"><span class="transaction-symbol ${t.type==='expense'?'expense':''}">${t.type==='income'?'↗':'↘'}</span><div class="desc-text"><b>${safeText(t.description)}</b><small>${safeText(t.person||t.notes||'No extra details')}</small></div></div></td><td><span class="category-tag">${safeText(t.category)}</span></td><td>${dateLabel(t.date)}</td><td><span class="type-badge ${t.type}">${t.type==='income'?'Income':'Expense'}</span></td><td class="align-right ${t.type==='income'?'amount-income':'amount-expense'}">${t.type==='income'?'+':'−'}${fmt(t.amount)}</td><td><button class="delete-btn" data-delete="${t.id}" title="Delete transaction" aria-label="Delete ${safeText(t.description)}">×</button></td>`;
    $('transactionRows').append(tr);
  });
  $('emptyState').hidden=items.length!==0;
  $('transactionRows').parentElement.style.display=items.length?'table':'none';
  $('showingText').textContent=`Showing ${Math.min(items.length,100)} of ${items.length} transaction${items.length===1?'':'s'}`;
  if(items.length>100) $('showingText').textContent+=' (first 100 shown; export for full list)';
}
function renderCustomers(){
  const people={};
  transactions.filter(t=>t.type==='income'&&t.person.trim()).forEach(t=>{const key=t.person.trim();if(!people[key])people[key]={name:key,count:0,total:0,last:t.date};people[key].count++;people[key].total+=Number(t.amount);if(t.date>people[key].last)people[key].last=t.date;});
  const rows=Object.values(people).sort((a,b)=>b.total-a.total);
  $('customerRows').innerHTML=rows.length?rows.map((p,i)=>`<tr><td><div class="desc-cell"><span class="transaction-symbol">${safeText(p.name.slice(0,2).toUpperCase())}</span><div class="desc-text"><b>${safeText(p.name)}</b><small>Income source / customer</small></div></div></td><td>${p.count}</td><td class="amount-income">${fmt(p.total)}</td><td>${dateLabel(p.last)}</td></tr>`).join(''):'<tr><td colspan="4">No customer names yet. Add a customer/source to an income record.</td></tr>';
}
function renderAll(){renderStats();renderChart();renderBreakdown();renderTransactions();renderCustomers();updateView();}
function updateView(){
  const titles={overview:['Overview','Good business starts with clarity.','Here’s how your business is performing. All amounts are in PKR.'],transactions:['Transactions','Every record, in one place.','Search, filter, remove, or export your business activity.'],reports:['Reports','Your business at a glance.','Review totals, cash flow, and spending categories.'],customers:['Customers','Know where your income comes from.','A simple directory generated from your income records.']};
  const [crumb,title,subtitle]=titles[activeView];$('crumbTitle').textContent=crumb;$('pageTitle').textContent=title;$('pageSubtitle').textContent=subtitle;
  $('overviewContent').hidden=activeView==='transactions'||activeView==='customers';
  $('recentPanel').hidden=activeView==='customers';
  $('customersPanel').hidden=activeView!=='customers';
  $('tableTitle').textContent=activeView==='transactions'?'All transactions':activeView==='reports'?'Report transactions':'Recent transactions';
  $('tableSubtitle').textContent=activeView==='transactions'?'Search and manage your saved records':activeView==='reports'?'Records included in the selected period':'A quick look at the latest activity';
  $('filterRow').hidden=activeView==='reports';
  document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.view===activeView));
  if(activeView==='transactions'){$('overviewContent').hidden=true;}
}
function openModal(type='income'){
  setType(type);$('transactionForm').reset();$('formType').value=type;$('transactionDate').value=dateISO(today);populateCategories();$('modalTitle').textContent='Add transaction';$('modalBackdrop').hidden=false;document.body.style.overflow='hidden';setTimeout(()=>$('description').focus(),50);
}
function closeModal(){$('modalBackdrop').hidden=true;document.body.style.overflow='';}
function setType(type){currentType=type;$('formType').value=type;document.querySelectorAll('.type-option').forEach(b=>b.classList.toggle('active',b.dataset.type===type));populateCategories();}
function populateCategories(){const select=$('category');const current=select.value;const opts=currentType==='income'?incomeCategories:expenseCategories;select.innerHTML=opts.map(c=>`<option>${safeText(c)}</option>`).join('');if(opts.includes(current))select.value=current;}
function showToast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);}
function exportCSV(){
  const items=visibleTransactions();if(!items.length){showToast('No transactions to export for this filter.');return;}
  const headers=['Date','Type','Description','Category','Amount (PKR)','Customer / Paid to','Notes'];
  const rows=items.map(t=>[t.date,t.type,t.description,t.category,t.amount,t.person||'',t.notes||'']);
  const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`nexora-transactions-${dateISO(today)}.csv`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('CSV report exported.');
}
document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>{activeView=b.dataset.view;updateView();$('sidebar').classList.remove('open');if(activeView==='transactions')$('searchInput').focus();}));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{activeView=b.dataset.go;updateView();}));
$('addBtn').addEventListener('click',()=>openModal());$('quickAdd').addEventListener('click',()=>openModal());$('emptyAddBtn').addEventListener('click',()=>openModal());
$('closeModal').addEventListener('click',closeModal);$('cancelModal').addEventListener('click',closeModal);
$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
document.querySelectorAll('.type-option').forEach(b=>b.addEventListener('click',()=>setType(b.dataset.type)));
$('transactionForm').addEventListener('submit',e=>{
  e.preventDefault();const description=$('description').value.trim(),amount=Number($('amount').value),date=$('transactionDate').value;
  if(!description||!Number.isFinite(amount)||amount<=0||!date){showToast('Please complete all required fields.');return;}
  transactions.push({id:Date.now(),type:currentType,description,amount:Math.round(amount),date,category:$('category').value,person:$('person').value.trim(),notes:$('notes').value.trim()});
  persist();closeModal();renderAll();showToast('Transaction saved successfully.');
});
$('transactionRows').addEventListener('click',e=>{const btn=e.target.closest('[data-delete]');if(!btn)return;const id=Number(btn.dataset.delete);const item=transactions.find(t=>t.id===id);if(!item)return;if(confirm(`Delete "${item.description}"? This cannot be undone.`)){transactions=transactions.filter(t=>t.id!==id);persist();renderAll();showToast('Transaction deleted.');}});
$('periodSelect').addEventListener('change',()=>{renderStats();renderBreakdown();renderTransactions();});
$('searchInput').addEventListener('input',renderTransactions);
document.querySelectorAll('.filter-chip').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;document.querySelectorAll('.filter-chip').forEach(x=>x.classList.toggle('selected',x===b));renderTransactions();}));
$('exportBtn').addEventListener('click',exportCSV);
$('menuBtn').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
$('dismissAlert').addEventListener('click',()=>document.querySelector('.demo-alert').hidden=true);
$('dateLabel').textContent=today.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase()+' · BUSINESS SNAPSHOT';
renderAll();
