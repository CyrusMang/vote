import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import socket from '../helpers/socket';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  
  useEffect(() => {
    const init = state => setCampaigns(state.campaigns || []);
    
    socket.on('state', init);
    socket.emit('ready');
    return () => {
      socket.removeListener('state', init);
    }
  }, []);
  
  return (
    <ul>
      {campaigns.map(campaign => (
        <li key={campaign.id}>
          <Campaign data={campaign} setCampaigns={setCampaigns}/>
        </li>
      ))}
    </ul>
  );
}

const Campaign = ({data, setCampaigns}) => {
  const [result, setResult] = useState({status: 'pending'});
  
  const select = useCallback(e => {
    const candidate_id = e.target.getAttribute('data-candidate');
    setResult({status: 'selected', candidate_id: parseInt(candidate_id)});
  }, []);
  
  const change = useCallback(e => {
    const input = e.target;
    setResult(prevState => ({
      ...prevState,
      idcard: input.value,
    }));
  }, []);
  
  const submit = useCallback(() => {
    socket.emit('vote', data.id, result.idcard, result.candidate_id, (res, e) => {
      if (e) {
        setResult(prevState => ({...prevState, error: e.message}));
      } else {
        setCampaigns(prevState => prevState.map(campaign => {
          if (campaign.id === data.id) {
            return {
              ...campaign,
              candidates: campaign.candidates.map(c => {
                if (c.id === result.candidate_id) {
                  return {...c, votes: c.votes+1}
                }
                return c;
              }),
            }
          }
          return campaign;
        }));
        setResult(prevState => ({...prevState, status: 'voted'}));
      }
    });
  }, [data, result, setCampaigns]);
  
  return (
    <div>
      <h2>{data.title}</h2>
      <small>{`From ${data.start_date} to ${data.end_date}`}</small>
      <ul>
        {data.candidates.map(candidate => (
          <li key={candidate.id}>
            <p>{`${candidate.name} - ${candidate.votes}`}</p>
            {result.status === 'selected' && result.candidate_id === candidate.id ? (
              <div>
                {result.error ? (<p className='error'>{result.error}</p>) : ''}
                <input onChange={change} placeholder={'Please enter your ID card number'} value={result.idcard || ''}/>
                <a href='#submit' onClick={submit}>submit</a>
              </div>
            ) : result.status === 'voted' ? result.candidate_id === candidate.id ? (
              <p>{'You voted'}</p>
            ) : '' : (
              <a href={`#candidate-${candidate.id}`} onClick={select} data-candidate={candidate.id}>Vote</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
Campaign.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.number,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    candidates: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      votes: PropTypes.number,
    })),
  }),
  setCampaigns: PropTypes.func,
};

export default CampaignList;