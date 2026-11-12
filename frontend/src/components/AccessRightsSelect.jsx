import React, {useId} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faLock, faGlobe, faChevronDown} from '@fortawesome/free-solid-svg-icons';
import {useI18n} from '../i18n';
import './CatalogFormFields.css';

export default function AccessRightsSelect({value, onChange, disabled = false}) {
  const id = useId();
  const {language} = useI18n();
  return <div className="catalog-access-field" translate="no">
    <label htmlFor={id} className="form-label-compact">{language === 'de' ? 'Zugriffsrechte' : 'Access Rights'}</label>
    <div className="catalog-access-select">
      <FontAwesomeIcon icon={value ? faGlobe : faLock} className="catalog-access-icon" aria-hidden="true"/>
      <select id={id} name="is_public" className="form-control" value={value ? 'public' : 'restricted'} disabled={disabled} onChange={e => onChange(e.target.value === 'public')}>
        <option value="public">{language === 'de' ? 'Öffentlich' : 'Public'}</option>
        <option value="restricted">{language === 'de' ? 'Eingeschränkt' : 'Restricted'}</option>
      </select>
      <FontAwesomeIcon icon={faChevronDown} className="catalog-access-arrow" aria-hidden="true"/>
    </div>
  </div>;
}
