import useSwr from 'swr';

import styles from './status.module.css';

async function fetchAPI(key){
  const response = await fetch(key);
  const body = await response.json();
  return body;
}



export default function StatusPage(){
  const {data, isLoading } = useSwr('/api/v1/status', fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedtAt, version, maxConnections, openedConnections = 'Carregando...';

  if(!isLoading){
    updatedtAt = new Date(data.updated_at).toLocaleString('pt-BR');
    version = data.dependencies.database.version;
    openedConnections =data.dependencies.database.opened_connections;
    maxConnections = data.dependencies.database.max_connections;
  }

  return (
    <div className={styles.container}>
      <h1>Status</h1>
      <div className={styles['status-items']}>
        <StatusItem prefix="Atualizado às" value={updatedtAt} />
        <StatusItem prefix="Versão" value={version} />
        <ConnectionStatus current={openedConnections} max={maxConnections} />
      </div>
    </div>
  )
}

function StatusItem({prefix, value}){
  return (
    <p><strong>{prefix}:</strong> {value}</p>
  )
}

function ConnectionStatus({current, max}){
  const percentage = current/max*100;
  const metric = `${current} de ${max} (${percentage}%)`;
  const isNearMaxCapacity = percentage > 94;
  return (
    <div className={styles['progress-container']}>
      <StatusItem prefix="Em uso(%)" value={metric} />
      <progress value={current} max={max} data-is-healthy={!isNearMaxCapacity}></progress>
    </div>
  ) 
}