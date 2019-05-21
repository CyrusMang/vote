import React, { useState, useEffect, useCallback } from 'react';
import socket from '../helpers/socket';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState({});
  
  useEffect(() => {
    socket.on('state', setCampaigns);
    return () => {
      socket.removeListener('state', setCampaigns);
    }
  }, []);
  
  return (
    <ul>
      {campaigns.map(campaign => (
        <li key={campaign.id}>
          <Campaign data={campaign}/>
        </li>
      ))}
    </ul>
  );
}

const Campaign = ({data}) => {
  const [state, setState] = useState({status: 'pending'});
  
  const select = useCallback(e => {
    setState({status: 'selected', e.target.getAttribute('data-candidate')})
  }, [])
  
  const change = useCallback(e => {
    setState(prevState => {
      ...prevState,
      idcard: e.target.value,
    });
  }, []);
  
  const submit = useCallback(() => {
    socket.emit('vote', data.id, state.idcard, state.candidate_id, (result, e) => {
      if (e) {
        return setState(prevState => {...prevState, error: e});
      }
      setState({status: 'voted'});
    })
  }, [data, state]);
  
  return (
    <div>
      <h2>{data.title}</h2>
      <small>{`From ${data.start_date} to ${data.end_date}`}</small>
      <ul>
        {data.candidates.map(candidate => (
          <li>
            <p>{`${candidate.name} - ${candidate.votes}`}</p>
            {state.status === 'selected' && state.candidate_id === candidate.id ? (
              <div>
                {state.error ? (<p className>{state.error}</p>) : ''}
                <input onChange={change} placeholder={'Please enter your ID card number'} value={idcard.number}>
                <a href='javascript:' onClick={submit}>submit</a>
              </div>
            ) : {state.status === 'voted' ? (
              <p>{'You voted'}</p>
            ) : (
              <a href='javascript:' onClick={select} data-candidate={candidate.id}>Vote</a>
            )}}
          </li>
        ))}
      </ul>
    </div>
  );
}
Campaign.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    candidates: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      votes: PropTypes.string,
    })),
  }),
};

export default CampaignList;