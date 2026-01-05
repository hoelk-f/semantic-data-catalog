# Semantic Data Catalog

A FAIR-compliant **Semantic Data Catalog** designed for decentralized Solid-based dataspaces. This catalog facilitates **data discovery** by integrating semantic metadata (via DCAT) and user-defined RDF-based semantic models.

**Live Demo**: [https://semantic-data-catalog.com](https://semantic-data-catalog.com)

---

## Installation

### Local Deployment

```bash
docker-compose up -d --build
```

This starts the full stack locally, including frontend, backend, Fuseki, and MariaDB. Environment variables are configured directly in the `docker-compose.yaml`.

The frontend will be available at [http://localhost:5000](http://localhost:5000).

### Production Deployment
Adjust the environment variables in `docker-compose.yaml` for your target environment and then run:

```bash
docker-compose up -d --build
```

---

## Environment Configuration
You can customize the deployment by editing environment variables in the `docker-compose.yaml`. Here's how key variables map to the `docker-compose.yaml`:

### Database (`db` service)

These credentials are injected via the `environment` block:

```yaml
environment:
  MYSQL_ROOT_PASSWORD: 8ED4iwZwPcwKPc
  MYSQL_DATABASE: semantic_data_catalog
  MYSQL_USER: semantic_data_catalog
  MYSQL_PASSWORD: mNXZqSq4oK53Q7
```

---

### Backend (`backend` service)

The backend reads its configuration via:

```yaml
environment:
  - BASE_URI=${BASE_URI}
  - DATABASE_URL=${DATABASE_URL}
  - CATALOG_NAME=Semantic Data Catalog
  - CATALOG_DESCRIPTION=Demonstrator Instance
  - RESET_DB=true
  - RUN_POPULATE=true
```

- `BASE_URI`: Root URL of the deployed backend (e.g. `http://localhost:8000` or `https://semantic-data-catalog.com/api`)
- `DATABASE_URL`: Full SQLAlchemy URI string like `mysql+pymysql://user:password@db/semantic_data_catalog`
- `RESET_DB`: Set to `true` during development to drop and recreate all tables on startup
- `RUN_POPULATE`: Whether to auto-run the `populate.py` script (loads test data)

#### Access Requests (Solid Notifications)

Access requests are delivered as Solid inbox notifications to the dataset owner.
This requires the Solid Dataspace Manager to process approvals/denials.
The catalog itself remains usable without the manager, but access requests will not work without it.

---

### Frontend (`frontend` service)

Set these in the `environment` block of the `frontend` service in `docker-compose.yaml` to control Solid login and version display:

```env
REACT_APP_OIDC_ISSUER=https://solidcommunity.net
REACT_APP_REDIRECT_URL=http://localhost:5000
REACT_APP_VERSION=0.5.0
```

The frontend is configured to run under the `/semantic-data-catalog` base path. Adjust the `PUBLIC_URL` value in `package.json` or set it in your environment if you deploy the UI elsewhere.

---

### Fuseki (`fuseki` service)

Default admin password:

```yaml
environment:
  - ADMIN_PASSWORD=admin
```

---

## Project Status

This project is a work in progress. The following features are currently missing and planned:

- Dataset Series (DCAT `dcat:DatasetSeries`) — not yet implemented  
- Data Services (DCAT `dcat:DataService`) — not yet supported  
- Possible code redundancies and UI enhancements under evaluation  

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Citation

If you use this tool in your research, please cite the following paper:

> **Bridging the Discovery Gap in Solid Dataspaces with a Semantic Data Catalog**  
> Florian Hölken, Alexander Paulus, Tobias Meisen, André Pomp.  
> *The 2nd Solid Symposium*, Leiden, Netherlands, April 24–25, 2025.  

```bibtex
@inproceedings{hoelken2025solidcatalog,
  title={Bridging the Discovery Gap in Solid Dataspaces with a Semantic Data Catalog},
  author={Hölken, Florian and Paulus, Alexander and Meisen, Tobias and Pomp, André},
  booktitle={The 2nd Solid Symposium Poster Session},
  year={2025},
  location={Leiden, Netherlands}
}
```

---

## Acknowledgements

Developed as part of the *Gesundes Tal* project  
Funded by BMWSB and KfW under the “Modellprojekte Smart Cities” program (Grant #19454890)

---

## Contact

For questions or contributions, please contact:

- Florian Hölken — [hoelken@uni-wuppertal.de](mailto:hoelken@uni-wuppertal.de)  
