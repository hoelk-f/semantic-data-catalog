# Semantic Data Catalog

A FAIR-compliant **Semantic Data Catalog** for decentralized Solid-based dataspaces. The catalog stores metadata directly in a Solid Pod using DCAT and supports **datasets** and **dataset series** for discovery.

---

## Architecture (Current)

- **Frontend (React)**: The UI that reads/writes DCAT metadata directly in the user's Solid Pod.
- **Solid Pod**: Source of truth for catalog metadata (Turtle documents).
- **Fuseki** (optional): Included in `docker-compose.yaml` for legacy/auxiliary triple-store workflows.

The previous SQL database setup is no longer used by the current `docker-compose.yaml`.

---

## Quickstart (Docker)

```bash
docker-compose up -d --build
```

Services:
- Frontend: `http://localhost:5000`
- Fuseki: `http://localhost:3030`

---

## Configuration

Edit the environment variables in `docker-compose.yaml` for the frontend:

```env
REACT_APP_OIDC_ISSUER=https://solidcommunity.net
```

Notes:
- The UI base path is `/semantic-data-catalog` (see `frontend/package.json` `homepage` and the `PUBLIC_URL` script flags).
- If you deploy under a different base path, adjust `PUBLIC_URL` accordingly (see the `frontend/package.json` scripts).

---

## Data Model (DCAT)

Catalog data is stored inside the user's Solid Pod under:

- `catalog/cat.ttl` (Catalog)
- `catalog/ds/*.ttl` (Datasets)
- `catalog/series/*.ttl` (Dataset Series)
- `catalog/records/*.ttl` (Catalog Records)

Modeling rules used by the UI:

- `dcat:Catalog` lists **datasets and series** via `dcat:dataset` (Series is a subclass of Dataset).
- Dataset series members are linked from **datasets** via `dcat:inSeries`.
- `dcat:seriesMember` on the series is optional/inverse.

---

## Access Requests (Solid Notifications)

Access requests are delivered as Solid inbox notifications to the dataset owner.
Approval/denial handling is implemented in a separate application. The catalog itself remains usable on its own.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Citation

If you use this tool in your research, please cite:

> **Bridging the Discovery Gap in Solid Dataspaces with a Semantic Data Catalog**  
> Florian Hoelken, Alexander Paulus, Tobias Meisen, Andre Pomp.  
> *The 2nd Solid Symposium*, Leiden, Netherlands, April 24-25, 2025.  

```bibtex
@inproceedings{hoelken2025solidcatalog,
  title={Bridging the Discovery Gap in Solid Dataspaces with a Semantic Data Catalog},
  author={Hoelken, Florian and Paulus, Alexander and Meisen, Tobias and Pomp, Andre},
  booktitle={The 2nd Solid Symposium Poster Session},
  year={2025},
  location={Leiden, Netherlands}
}
```

---

## Acknowledgements

This work has been supported as part of the research project _Gesundes Tal_ in collaboration with the city of Wuppertal, funded by the Federal Ministry of Housing, Urban Development and Building (BMWSB) and the Reconstruction Loan Corporation (KfW) through the funding program “Modellprojekte Smart Cities: Stadtentwicklung und Digitalisierung” (grant number 19454890).

---

## Contact

For questions or contributions, please contact:

- Florian Hoelken — [hoelken@uni-wuppertal.de](mailto:hoelken@uni-wuppertal.de)
