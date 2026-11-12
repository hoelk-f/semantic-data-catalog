import React, {act, createRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import ThemeTags from './ThemeTags';
import AccessRightsSelect from './AccessRightsSelect';
import {I18nProvider} from '../i18n';
let container,root,ref;
beforeEach(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;container=document.createElement('div');document.body.append(container);root=createRoot(container);ref=createRef();});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const change=(element,value)=>act(()=>{Object.getOwnPropertyDescriptor(element.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event(element.tagName==='SELECT'?'change':'input',{bubbles:true}));});
function Form(){const[tags,setTags]=useState([]);return <ThemeTags ref={ref} value={tags} onChange={setTags} suggestions={['https://example.org/theme/recycling']}/>;}
test('commits, deduplicates, selects and removes themes; pending text is included when saved',()=>{
  act(()=>root.render(<I18nProvider language="en"><Form/></I18nProvider>));
  const input=container.querySelector('input');
  change(input,'Environment');act(()=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  expect(ref.current.getValues()).toEqual(['Environment']);
  change(input,'environment');act(()=>container.querySelector('.catalog-theme-add').click());
  expect(container.querySelectorAll('.catalog-theme-tag')).toHaveLength(1);
  change(input,'recyc');act(()=>container.querySelector('.catalog-theme-suggestions button').click());
  expect(ref.current.getValues()).toContain('https://example.org/theme/recycling');
  change(input,'Climate');expect(ref.current.getValues()).toContain('Climate');
  act(()=>container.querySelector('.catalog-theme-tag button').click());
  expect(ref.current.getValues()).not.toContain('environment');
});
test('access selector is labelled, controlled and translated',()=>{
  const onChange=jest.fn();act(()=>root.render(<I18nProvider language="de"><AccessRightsSelect value={false} onChange={onChange}/></I18nProvider>));
  const select=container.querySelector('select');expect(container.querySelector('label').htmlFor).toBe(select.id);
  expect(select.options[select.selectedIndex].textContent).toBe('Eingeschränkt');
  change(select,'public');expect(onChange).toHaveBeenCalledWith(true);
});
